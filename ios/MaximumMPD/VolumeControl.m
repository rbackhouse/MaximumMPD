/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2019 Richard Backhouse
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
 *
 * Thanks to https://github.com/rtmalone/react-native-volume-control/blob/develop/ios/RNVolumeControl/RNVolumeControl.m for implementation ideas
 */
#import "VolumeControl.h"

@implementation VolumeControl

- (id)init {
  self = [super init];
  self.listening = NO;
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onPause) name:UIApplicationDidEnterBackgroundNotification object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onResume) name:UIApplicationWillEnterForegroundNotification object:nil];
  return self;
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context{
    if ([keyPath isEqual:@"outputVolume"] && self.listening == YES) {
      float newVolume = [self.audioSession outputVolume];
      NSLog(@"newVolume  %f", newVolume);
      [self sendEventWithName:@"OnVolumeChange" body:@{@"volume": [NSNumber numberWithFloat: newVolume]}];
    }
}

- (void)dealloc {
  [self cleanup];
}

- (void) onPause {
  if (self.listening == YES) {
    [self cleanup];
  }
}

- (void) onResume {
  if (self.listening == YES) {
    [self start];
  }
}

- (void) start {
  self.audioSession = [AVAudioSession sharedInstance];
  [self.audioSession setActive:YES error:nil];

  [self.audioSession addObserver:self forKeyPath:@"outputVolume" options:0 context:nil];

  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.01 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    self.volumeView = [[MPVolumeView alloc] init];
    self.volumeView.showsRouteButton = NO;
    self.volumeView.showsVolumeSlider = NO;
    
    for (UIView *view in self.volumeView.subviews) {
        if ([view isKindOfClass:[UISlider class]]) {
            self.volumeViewSlider = (UISlider *)view;
            break;
        }
    }
  });
}

- (void) cleanup {
  if (self.audioSession != nil) {
    [self.audioSession removeObserver:self forKeyPath:@"outputVolume"];
    self.audioSession = nil;
    self.volumeView = nil;
    self.volumeViewSlider = nil;
  }
}

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(setVolume:(float)volume) {
  if (self.listening == NO) {
    self.listening = YES;
    [self start];
  }
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.01 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    NSLog(@"setVolume  %f", volume);
    self.volumeViewSlider.value = volume;
  });
}

RCT_EXPORT_METHOD(getVolume:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject){
    dispatch_sync(dispatch_get_main_queue(), ^{
        resolve([NSNumber numberWithFloat:[self.volumeViewSlider value]]);
    });
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"OnVolumeChange"];
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

@end

