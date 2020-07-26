/*
* The MIT License (MIT)
*
* Copyright (c) 2020 Richard Backhouse
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

#import <Foundation/Foundation.h>
@import MediaPlayer;

#import "NowPlayingControl.h"

@implementation NowPlayingControl

- (id)init {
  self = [super init];
  self.isPlaying = FALSE;
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onPause) name:UIApplicationDidEnterBackgroundNotification object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onResume) name:UIApplicationWillEnterForegroundNotification object:nil];
  return self;
}

- (void) onPause {
}

- (void) onResume {
  if (self.queuePlayer != nil && self.isPlaying == TRUE) {
      [self.queuePlayer play];
  }
}


RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
  return @[@"OnNowPlayingEvent"];
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}


RCT_EXPORT_METHOD(start) {
  dispatch_sync(dispatch_get_main_queue(), ^{
      NSString *soundFilePath = [[NSBundle mainBundle] pathForResource:@"Silent" ofType:@"wav"];
      NSURL *soundFileURL = [NSURL fileURLWithPath:soundFilePath];
      
      AVPlayerItem *playerItem = [AVPlayerItem playerItemWithURL:soundFileURL];
      self.queuePlayer = [AVQueuePlayer queuePlayerWithItems:@[playerItem]];
      self.playerLooper = [AVPlayerLooper playerLooperWithPlayer:self.queuePlayer templateItem:playerItem];

      [[UIApplication sharedApplication] beginReceivingRemoteControlEvents];
      
      MPRemoteCommandCenter *remoteCenter = [MPRemoteCommandCenter sharedCommandCenter];
      [remoteCenter.pauseCommand addTarget:self action:@selector(onPause:)];
      remoteCenter.pauseCommand.enabled = true;
      [remoteCenter.playCommand addTarget:self action:@selector(onPlay:)];
      remoteCenter.playCommand.enabled = true;
      [remoteCenter.stopCommand addTarget:self action:@selector(onStop:)];
      remoteCenter.stopCommand.enabled = true;
      [remoteCenter.togglePlayPauseCommand addTarget:self action:@selector(onTogglePlayPause:)];
      remoteCenter.togglePlayPauseCommand.enabled = true;
      [remoteCenter.nextTrackCommand addTarget:self action:@selector(onNextTrack:)];
      remoteCenter.nextTrackCommand.enabled = true;
      [remoteCenter.previousTrackCommand addTarget:self action:@selector(onPreviousTrack:)];
      remoteCenter.previousTrackCommand.enabled = true;
  });
}

RCT_EXPORT_METHOD(stop) {
  dispatch_sync(dispatch_get_main_queue(), ^{
    [[UIApplication sharedApplication] endReceivingRemoteControlEvents];
    MPRemoteCommandCenter *remoteCenter = [MPRemoteCommandCenter sharedCommandCenter];
    [remoteCenter.pauseCommand removeTarget:self action:@selector(onPause:)];
    remoteCenter.pauseCommand.enabled = false;
    [remoteCenter.playCommand removeTarget:self action:@selector(onPlay:)];
    remoteCenter.playCommand.enabled = false;
    [remoteCenter.stopCommand removeTarget:self action:@selector(onStop:)];
    remoteCenter.stopCommand.enabled = false;
    [remoteCenter.togglePlayPauseCommand removeTarget:self action:@selector(onTogglePlayPause:)];
    remoteCenter.togglePlayPauseCommand.enabled = false;
    [remoteCenter.nextTrackCommand removeTarget:self action:@selector(onNextTrack:)];
    remoteCenter.nextTrackCommand.enabled = false;
    [remoteCenter.previousTrackCommand removeTarget:self action:@selector(onPreviousTrack:)];
    remoteCenter.previousTrackCommand.enabled = false;
    self.playerLooper = nil;
    [self.queuePlayer pause];
    self.queuePlayer = nil;
  });
}

RCT_EXPORT_METHOD(playSilence) {
  if (self.queuePlayer != nil) {
    [self.queuePlayer play];
  }
}

RCT_EXPORT_METHOD(pauseSilence) {
  if (self.queuePlayer != nil) {
    [self.queuePlayer pause];
  }
}

RCT_EXPORT_METHOD(setNowPlaying:(NSDictionary *) values) {
  MPNowPlayingInfoCenter *center = [MPNowPlayingInfoCenter defaultCenter];
  NSMutableDictionary *updateValues = [[NSMutableDictionary alloc] initWithDictionary: center.nowPlayingInfo];

  NSString *state = [values objectForKey:@"state"];

  if ([state isEqual: @"stop"]) {
    if (@available(iOS 13.0, *)) {
      center.playbackState = MPNowPlayingPlaybackStateStopped;
    }
    center.nowPlayingInfo = nil;
    return;
  }
  
  self.isPlaying = [state isEqual: @"play"] ? TRUE : FALSE;
  
  if ([values objectForKey: MPMediaItemPropertyArtist]) {
    [updateValues setValue:[values objectForKey:MPMediaItemPropertyArtist] forKey:MPMediaItemPropertyArtist];
  }
  if ([values objectForKey: MPMediaItemPropertyAlbumTitle]) {
    [updateValues setValue:[values objectForKey:MPMediaItemPropertyAlbumTitle] forKey:MPMediaItemPropertyAlbumTitle];
  }
  if ([values objectForKey: MPMediaItemPropertyTitle]) {
    [updateValues setValue:[values objectForKey:MPMediaItemPropertyTitle] forKey:MPMediaItemPropertyTitle];
  }
  if ([values objectForKey: MPMediaItemPropertyPlaybackDuration]) {
    [updateValues setValue:[values objectForKey:  MPMediaItemPropertyPlaybackDuration] forKey:MPMediaItemPropertyPlaybackDuration];
  }
  if ([values objectForKey: MPNowPlayingInfoPropertyElapsedPlaybackTime]) {
    [updateValues setValue:[values objectForKey:  MPNowPlayingInfoPropertyElapsedPlaybackTime] forKey:MPNowPlayingInfoPropertyElapsedPlaybackTime];
  }
  if ([values objectForKey: MPMediaItemPropertyAlbumTrackNumber]) {
    [updateValues setValue:[values objectForKey:  MPMediaItemPropertyAlbumTrackNumber] forKey:MPMediaItemPropertyAlbumTrackNumber];
  }
  
  NSNumber *speed = [state isEqual:@"pause"] ? [NSNumber numberWithDouble:0] : [NSNumber numberWithDouble:1];
  [updateValues setValue:speed forKey:@"speed"];
  
  if (@available(iOS 13.0, *)) {
    if ([state isEqual: @"play"]) {
      [updateValues setValue:[NSNumber numberWithInt:1] forKey:MPNowPlayingInfoPropertyPlaybackRate];
      center.playbackState = MPNowPlayingPlaybackStatePlaying;
    } else if ([state isEqual: @"pause"]) {
      [updateValues setValue:[NSNumber numberWithInt:0] forKey:MPNowPlayingInfoPropertyPlaybackRate];
      center.playbackState = MPNowPlayingPlaybackStatePaused;
    }
  }
  center.nowPlayingInfo = updateValues;
}

- (MPRemoteCommandHandlerStatus)onPause:(MPRemoteCommandEvent*)event {
    [self sendEventWithName:@"OnNowPlayingEvent" body:@{@"type": @"pause"}];
    return MPRemoteCommandHandlerStatusSuccess;
}
- (MPRemoteCommandHandlerStatus)onPlay:(MPRemoteCommandEvent*)event {
    [self sendEventWithName:@"OnNowPlayingEvent" body:@{@"type": @"play"}];
    return MPRemoteCommandHandlerStatusSuccess;
}
- (MPRemoteCommandHandlerStatus)onChangePlaybackPosition:(MPChangePlaybackPositionCommandEvent*)event {
    return MPRemoteCommandHandlerStatusSuccess;
}
- (MPRemoteCommandHandlerStatus)onStop:(MPRemoteCommandEvent*)event {
    [self sendEventWithName:@"OnNowPlayingEvent" body:@{@"type": @"stop"}];
    return MPRemoteCommandHandlerStatusSuccess;
}
- (MPRemoteCommandHandlerStatus)onTogglePlayPause:(MPRemoteCommandEvent*)event {
    [self sendEventWithName:@"OnNowPlayingEvent" body:@{@"type": @"playpause"}];
    return MPRemoteCommandHandlerStatusSuccess;
}
- (MPRemoteCommandHandlerStatus)onEnableLanguageOption:(MPRemoteCommandEvent*)event {
    return MPRemoteCommandHandlerStatusSuccess;
}
- (MPRemoteCommandHandlerStatus)onDisableLanguageOption:(MPRemoteCommandEvent*)event {
    return MPRemoteCommandHandlerStatusSuccess;
}
- (MPRemoteCommandHandlerStatus)onNextTrack:(MPRemoteCommandEvent*)event {
    [self sendEventWithName:@"OnNowPlayingEvent" body:@{@"type": @"next"}];
    return MPRemoteCommandHandlerStatusSuccess;
}
- (MPRemoteCommandHandlerStatus)onPreviousTrack:(MPRemoteCommandEvent*)event {
    [self sendEventWithName:@"OnNowPlayingEvent" body:@{@"type": @"previous"}];
    return MPRemoteCommandHandlerStatusSuccess;
}
- (MPRemoteCommandHandlerStatus)onSeekForward:(MPRemoteCommandEvent*)event {
    return MPRemoteCommandHandlerStatusSuccess;
}
- (MPRemoteCommandHandlerStatus)onSeekBackward:(MPRemoteCommandEvent*)event {
    return MPRemoteCommandHandlerStatusSuccess;
}
- (MPRemoteCommandHandlerStatus)onSkipBackward:(MPRemoteCommandEvent*)event {
    return MPRemoteCommandHandlerStatusSuccess;
}
- (MPRemoteCommandHandlerStatus)onSkipForward:(MPRemoteCommandEvent*)event {
    return MPRemoteCommandHandlerStatusSuccess;
}

@end

