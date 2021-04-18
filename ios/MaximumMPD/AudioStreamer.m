/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2021 Richard Backhouse
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

#import "AudioStreamer.h"

@implementation AudioStreamer

static void * const PlayerItemContext = (void*)&PlayerItemContext;

- (id)init {
  self = [super init];
  self.player = [AVQueuePlayer queuePlayerWithItems:@[]];
  self.player.actionAtItemEnd = AVPlayerActionAtItemEndAdvance;
  
  AudioStreamer __weak *weakSelf = self;
  
  self.timeObserverToken = [self.player addPeriodicTimeObserverForInterval:CMTimeMake(1, 1) queue:dispatch_get_main_queue() usingBlock:^(CMTime time) {
    double timeElapsed = CMTimeGetSeconds(time);
    AVPlayerItem *playerItem = [weakSelf.player currentItem];
    if (playerItem != nil) {
      AVURLAsset *asset = (AVURLAsset *)[playerItem asset];
      [weakSelf sendEventWithName:@"OnItemStatus" body:@{@"type": @"timeStatus", @"url": [asset.URL absoluteString], @"timeElapsed": [NSNumber numberWithDouble:timeElapsed]}];
    }
  }];
  
  AVAudioSession *session = [AVAudioSession sharedInstance];
  NSError *error = nil;
  [session setCategory:AVAudioSessionCategoryPlayback
                  mode:AVAudioSessionModeDefault
               options:AVAudioSessionCategoryOptionDefaultToSpeaker|AVAudioSessionCategoryOptionDuckOthers
                 error:&error];
  if (nil == error) {
  }
  return self;
}

RCT_EXPORT_MODULE();

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(addSong:(NSString *)strUrl) {
  NSLog(@"addSong : %@", strUrl);

  AVAsset *asset = [AVAsset assetWithURL:[NSURL URLWithString:strUrl]];
  AVPlayerItem *playerItem = [AVPlayerItem playerItemWithAsset:asset];
  
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(itemDidFinishPlaying:) name:AVPlayerItemDidPlayToEndTimeNotification object:playerItem];
  
  NSKeyValueObservingOptions options = NSKeyValueObservingOptionOld | NSKeyValueObservingOptionNew;
  [playerItem addObserver:self
                   forKeyPath:@"status"
                      options:options
                      context:PlayerItemContext];
  [self.player insertItem:playerItem afterItem:nil];
  return [((AVURLAsset *)[playerItem asset]).URL absoluteString];
}

RCT_EXPORT_METHOD(removeSong:(NSString *)strUrl) {
  NSArray<AVPlayerItem *> *items = [self.player items];
  for (AVPlayerItem *playerItem in items) {
    AVURLAsset *asset = (AVURLAsset *)[playerItem asset];
    if (strUrl == [asset.URL absoluteString]) {
      [self.player removeItem:playerItem];
      return;
    }
  }
}

RCT_EXPORT_METHOD(play) {
  NSLog(@"play");
  if ([self.player items].count > 0) {
    [self.player play];
    [self sendEventWithName:@"OnItemStatus" body:@{@"type": @"isPlaying", @"isPlaying": [NSNumber numberWithBool:1]}];
  } else {
    [self sendEventWithName:@"OnItemStatus" body:@{@"type": @"isPlaying", @"isPlaying": [NSNumber numberWithBool:0]}];
  }
}

RCT_EXPORT_METHOD(pause) {
  NSLog(@"pause");
  [self.player pause];
  [self sendEventWithName:@"OnItemStatus" body:@{@"type": @"isPlaying", @"isPlaying": [NSNumber numberWithBool:0]}];
}

RCT_EXPORT_METHOD(next) {
  NSLog(@"next");
  [self.player advanceToNextItem];
}

RCT_EXPORT_METHOD(getQueue:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  NSLog(@"getQueue %@", [self.player items]);
  
  NSArray<AVPlayerItem *> *items = [self.player items];
  NSMutableArray<NSString *> *urls = [NSMutableArray<NSString *> array];

  for (AVPlayerItem *playerItem in items) {
    AVURLAsset *asset = (AVURLAsset *)[playerItem asset];
    [urls addObject:[asset.URL absoluteString]];
  }

  resolve(urls);
}

RCT_EXPORT_METHOD(clearQueue) {
  NSLog(@"clearQueue");
  [self.player removeAllItems];
}

-(void)itemDidFinishPlaying:(NSNotification *) notification {
  AVPlayerItem *playerItem = [notification object];
  AVURLAsset *asset = (AVURLAsset *)[playerItem asset];
  NSLog(@"itemDidFinishPlaying : %@", [asset.URL absoluteString]);
  [self sendEventWithName:@"OnItemStatus" body:@{@"type": @"finishedPlaying", @"url": [asset.URL absoluteString]}];
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary<NSString *,id> *)change
                       context:(void *)context {
    if (context != PlayerItemContext) {
        [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
        return;
    }
 
    if ([keyPath isEqualToString:@"status"]) {
        AVPlayerItemStatus status = AVPlayerItemStatusUnknown;
        NSNumber *statusNumber = change[NSKeyValueChangeNewKey];
        if ([statusNumber isKindOfClass:[NSNumber class]]) {
            status = statusNumber.integerValue;
        }
        AVPlayerItem *playerItem = object;
        AVURLAsset *asset = (AVURLAsset *)[playerItem asset];

        switch (status) {
            case AVPlayerItemStatusReadyToPlay:
              NSLog(@"readyToPlay : %@", asset.URL);
              [self sendEventWithName:@"OnItemStatus" body:@{@"type": @"readyToPlay", @"url": [asset.URL absoluteString]}];
              break;
            case AVPlayerItemStatusFailed:
              NSLog(@"failedToPlay : %@ %@", asset.URL, playerItem.error.localizedDescription);
              [self sendEventWithName:@"OnItemStatus" body:@{@"type": @"failedToPlay", @"url": [asset.URL absoluteString], @"error": playerItem.error.localizedDescription}];
              break;
            case AVPlayerItemStatusUnknown:
              break;
        }
    }
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"OnItemStatus"];
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

@end
