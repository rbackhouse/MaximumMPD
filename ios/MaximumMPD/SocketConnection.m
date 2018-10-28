/*
* The MIT License (MIT)
*
* Copyright (c) 2018 Richard Backhouse
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

#import "SocketConnection.h"
#import <React/RCTLog.h>

@implementation SocketConnection

- (id) init {
  self = [super init];

  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onPause) name:UIApplicationDidEnterBackgroundNotification object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onResume) name:UIApplicationWillEnterForegroundNotification object:nil];

  return self;
}

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(connect:(NSString *)host port:(NSInteger)port) {
  self.host = host;
  self.port = (int)port;
  self.internalConnect = false;
  [self mpdConnect];
}

RCT_EXPORT_METHOD(disconnect) {
  [self mpdDisconnect];
  self.host = nil;
  self.port = 0;
}

RCT_EXPORT_METHOD(writeMessage:(NSString *)message) {
  NSData *data = [[NSData alloc] initWithData:[message dataUsingEncoding:NSUTF8StringEncoding]];
  [self.outputStream write:[data bytes] maxLength:[data length]];
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"OnStateChange", @"OnMessage", @"OnError", @"OnPauseResume"];
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
  //return dispatch_queue_create("org.potpie.MaximumMPD.AsyncQueue", DISPATCH_QUEUE_SERIAL);
}

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (void)stream:(NSStream *)stream handleEvent:(NSStreamEvent)streamEvent {
  switch (streamEvent) {
    case NSStreamEventOpenCompleted: {
      if (stream == self.inputStream) {
        NSString* statusMsg = nil;
        if (self.internalConnect == false) {
          statusMsg = @"connected";
        } else {
          statusMsg = @"internalConnected";
          self.internalConnect = false;
        }
        [self sendEventWithName:@"OnStateChange" body:@{@"msg": statusMsg}];
      }
      break;
    }

    case NSStreamEventHasBytesAvailable:
      if (stream == self.inputStream) {
        uint8_t buffer[1024];
        long len;

        while ([self.inputStream hasBytesAvailable]) {
          len = [self.inputStream read:buffer maxLength:sizeof(buffer)];
          if (len > 0) {

            NSString *output = [[NSString alloc] initWithBytes:buffer length:len encoding:NSUTF8StringEncoding];

            if (output != nil) {
              [self sendEventWithName:@"OnMessage" body:@{@"output": output}];
            }
          }
        }
      }
      break;


    case NSStreamEventErrorOccurred: {
      if (stream == self.inputStream) {
        NSError *theError = [stream streamError];
        [self sendEventWithName:@"OnError" body:@{@"error": theError.localizedDescription}];
      }
      break;
    }

    case NSStreamEventEndEncountered: {
      if (stream == self.inputStream) {
        [self sendEventWithName:@"OnStateChange" body:@{@"msg": @"disconnected"}];
      }
      [stream close];
      [stream removeFromRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
      stream = nil;
      break;
    }

    default:
      break;
  }
}

- (void) onPause {
  NSLog(@"pause");

  [self sendEventWithName:@"OnPauseResume" body:@{@"msg": @"paused"}];
  if (self.host != nil) {
    [self mpdDisconnect];
  }
}

- (void) onResume {
  NSLog(@"resume");
  if (self.host != nil) {
    [NSThread sleepForTimeInterval:1.0f];
    self.internalConnect = true;
    [self mpdConnect];
  }
  [self sendEventWithName:@"OnPauseResume" body:@{@"msg": @"resumed"}];
}

- (void) mpdConnect {
  CFReadStreamRef readStream;
  CFWriteStreamRef writeStream;
  CFStreamCreatePairWithSocketToHost(NULL, (__bridge CFStringRef)self.host, self.port, &readStream, &writeStream);
  self.inputStream = CFBridgingRelease(readStream);
  self.outputStream = CFBridgingRelease(writeStream);

  [self.inputStream setDelegate:self];
  [self.outputStream setDelegate:self];
  [self.inputStream scheduleInRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
  [self.outputStream scheduleInRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
  [self.inputStream open];
  [self.outputStream open];
}

- (void) mpdDisconnect {
  [self.inputStream close];
  [self.inputStream removeFromRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
  self.inputStream = nil;

  [self.outputStream close];
  [self.outputStream removeFromRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
  self.outputStream = nil;
}
@end
