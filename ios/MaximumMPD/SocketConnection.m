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

static NSData *err;
static NSData *init;
static NSData *binary;
static NSData *crdata;

@implementation SocketConnection

- (id) init {
  self = [super init];

  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onPause) name:UIApplicationDidEnterBackgroundNotification object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onResume) name:UIApplicationWillEnterForegroundNotification object:nil];
  self._data = [NSMutableData data];
  
  NSString *path;
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  path = [[paths objectAtIndex:0] stringByAppendingPathComponent:@"mpd_album_art"];
  NSError *error;
  if (![[NSFileManager defaultManager] fileExistsAtPath:path])  {
    if (![[NSFileManager defaultManager] createDirectoryAtPath:path
                                   withIntermediateDirectories:NO
                                                    attributes:nil
                                                         error:&error]) {
      NSLog(@"create albumart directory error: %@", error);
    } else {
      NSLog(@"created albumart directory [%@]", path);
    }
  }
  self.albumArtDir = path;
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

RCT_EXPORT_METHOD(writeMessage:(NSString *)message filename:(NSString *)filename) {
  if (filename != nil) {
    NSString *path;
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    path = [[paths objectAtIndex:0] stringByAppendingPathComponent:@"mpd_album_art"];
    path = [path stringByAppendingPathComponent:filename];

    self.albumArtFilename = path;
  }
  NSData *data = [[NSData alloc] initWithData:[message dataUsingEncoding:NSUTF8StringEncoding]];
  //NSLog(@"writeMessage [%@]", message);
  [self.outputStream write:[data bytes] maxLength:[data length]];
}

RCT_EXPORT_METHOD(deleteAlbumArtFile:(NSString *)filename) {
  NSString *path;
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  path = [[paths objectAtIndex:0] stringByAppendingPathComponent:@"mpd_album_art"];
  path = [path stringByAppendingPathComponent:filename];
  NSError *error;
  if ([[NSFileManager defaultManager] fileExistsAtPath:path]) {
    if (![[NSFileManager defaultManager] removeItemAtPath:path error:&error]) {
      NSLog(@"Delete file error: %@", error);
    } else {
      NSLog(@"deleted albumart file [%@]", path);
    }
  }
}

RCT_EXPORT_METHOD(listAlbumArtDir:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  NSString *path;
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  path = [[paths objectAtIndex:0] stringByAppendingPathComponent:@"mpd_album_art"];
  NSError *error;

  NSArray *files = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:path error:&error];
  if (error != nil) {
    reject(@"albumart", @"Album Art error", error);
  } else {
    NSLog(@"albumart files [%@]", files);
    resolve(files);
  }
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"OnStateChange", @"OnError", @"OnPauseResume", @"OnResponse", @"OnInit", @"OnResponseError"];
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
        NSLog(@"stream open [%@]", statusMsg);
        [self sendEventWithName:@"OnStateChange" body:@{@"msg": statusMsg, @"albumArtDir": self.albumArtDir}];
      }
      break;
    }

    case NSStreamEventHasBytesAvailable:
      if (stream == self.inputStream) {
        uint8_t buffer[8192];
        long len;

        while ([self.inputStream hasBytesAvailable]) {
          len = [self.inputStream read:buffer maxLength:sizeof(buffer)];
          
          if (len > 0) {
            [self._data appendBytes:(const void *)buffer length:len];
            //NSLog(@"output %ld %@", len, [self._data description]);
            
            [self findBinary];
            
            if ([self findBufferEnd] == TRUE) {
              if (self.binaryFound == TRUE) {
                NSString *out = [NSString stringWithFormat:@"%@%@", self.binaryTxt, @"\nOK\n"];
                NSMutableData *albumArtData = [NSMutableData data];
                [albumArtData appendData:[self._data subdataWithRange:NSMakeRange(self.binaryOffset+1, self.binarySize)]];
                [self writeAlbumArt:albumArtData];
                [self sendEventWithName:@"OnResponse" body:@{@"data": out, @"filename":self.albumArtFilename}];
                self._data = [NSMutableData data];
                self.binaryFound = FALSE;
                //NSLog(@"binary out [%ld] [%@]", [albumArtData length], out);
              } else {
                NSString *out = [[NSString alloc] initWithBytes:[self._data bytes] length:[self._data length] encoding:NSUTF8StringEncoding];
                [self sendEventWithName:@"OnResponse" body:@{@"data": out}];
                self._data = [NSMutableData data];
                //NSLog(@"out [%@]", out);
              }
            }
            
            if ([self findInit] == TRUE) {
              NSString *out = [[NSString alloc] initWithBytes:[self._data bytes] length:[self._data length] encoding:NSUTF8StringEncoding];
              [self sendEventWithName:@"OnInit" body:@{@"data": out}];
              self._data = [NSMutableData data];
              //NSLog(@"init [%@]", out);
            }
            
            if ([self findError] == TRUE) {
              NSString *out = [[NSString alloc] initWithBytes:[self._data bytes] length:[self._data length] encoding:NSUTF8StringEncoding];
              [self sendEventWithName:@"OnResponseError" body:@{@"data": out}];
              self._data = [NSMutableData data];
              //NSLog(@"error [%@]", out);
            }
          }
        }
      }
      break;


    case NSStreamEventErrorOccurred: {
      if (stream == self.inputStream) {
        NSError *theError = [stream streamError];
        NSLog(@"stream error [%@]", theError.localizedDescription);
        [self sendEventWithName:@"OnError" body:@{@"error": theError.localizedDescription}];
      }
      break;
    }

    case NSStreamEventEndEncountered: {
      if (stream == self.inputStream) {
        NSLog(@"stream end");
        self._data = [NSMutableData data];
        self.binaryFound = FALSE;
        self.binaryOffset = 0;
        self.binarySize = 0;
        self.binaryTxt = nil;
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
  NSLog(@"mpdConnect");

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
  NSLog(@"mpdDisconnect");

  [self.inputStream close];
  [self.inputStream removeFromRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
  self.inputStream = nil;

  [self.outputStream close];
  [self.outputStream removeFromRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
  self.outputStream = nil;
}

- (Boolean) findBufferEnd {
  const char* bytes = (const char*)[self._data bytes];
  uint8_t b1 = bytes[[self._data length]-1];
  uint8_t b2 = bytes[[self._data length]-2];
  uint8_t b3 = bytes[[self._data length]-3];
  if (b1 == 0x0a && b2 == 0x4b && b3 == 0x4f) {
    if ([self._data length] > 3) {
      uint8_t b4 = bytes[[self._data length]-4];
      if (b4 == 0x0a) {
        return TRUE;
      } else {
        return FALSE;
      }
    } else {
      return TRUE;
    }
  } else {
    return FALSE;
  }
}

- (Boolean) findError {
  if (err == nil) {
    UInt8 errmsg[] = { 0x41, 0x43, 0x4b, 0x20, 0x5b };
    err = [NSData dataWithBytes:errmsg length:sizeof(errmsg)];
  }
  
  NSRange range = [self._data rangeOfData:err
                                  options:NSDataSearchBackwards
                                    range:NSMakeRange(0u, [self._data length])];
  if (range.location == NSNotFound) {
    return FALSE;
  } else {
    //NSLog(@"Error found at position %lu", (unsigned long)range.location);
    return TRUE;
  }
}

- (Boolean) findInit {
  if (init == nil) {
    UInt8 initmsg[] = { 0x4f, 0x4b, 0x20, 0x4d, 0x50, 0x44, 0x20 };
    init = [NSData dataWithBytes:initmsg length:sizeof(initmsg)];
  }
  
  NSRange range = [self._data rangeOfData:init
                                  options:0
                                    range:NSMakeRange(0u, [self._data length])];
  if (range.location == NSNotFound) {
    return FALSE;
  } else {
    //NSLog(@"Init found at position %lu", (unsigned long)range.location);
    return TRUE;
  }
}

- (Boolean) findBinary {
  if (self.binaryFound == TRUE) {
    return TRUE;
  }
  
  if (binary == nil) {
    UInt8 binarymsg[] = { 0x62, 0x69, 0x6e, 0x61, 0x72, 0x79, 0x3a, 0x20 };
    binary = [NSData dataWithBytes:binarymsg length:sizeof(binarymsg)];
  }
  
  if (crdata == nil) {
    UInt8 cr = 0x0a;
    crdata = [NSData dataWithBytes:&cr length:sizeof(cr)];
  }
  
  NSRange range = [self._data rangeOfData:binary
                                  options:0
                                    range:NSMakeRange(0u, [self._data length])];
  if (range.location == NSNotFound) {
    return FALSE;
  } else {
    NSRange crrange = [self._data rangeOfData:crdata
                                    options:0
                                      range:NSMakeRange(range.location, [self._data length]-range.location)];
    if (crrange.location != NSNotFound) {
      NSData *txtData = [self._data subdataWithRange:NSMakeRange(0u, crrange.location)];
      self.binaryTxt = [[NSString alloc] initWithBytes:[txtData bytes] length:[txtData length] encoding:NSUTF8StringEncoding];
      self.binaryFound = TRUE;
      NSData *size = [self._data subdataWithRange:NSMakeRange(range.location+8, crrange.location - (range.location+8))];
      NSString *sizeStr = [[NSString alloc] initWithBytes:[size bytes] length:[size length] encoding:NSUTF8StringEncoding];
      NSNumberFormatter* formatter = [[NSNumberFormatter alloc] init];
      self.binarySize = [[formatter numberFromString:sizeStr] unsignedLongValue];
      self.binaryOffset = crrange.location;
      //NSLog(@"Binary found at position %lu offset %lu size %lu", (unsigned long)range.location, self.binaryOffset, self.binarySize);
    } else {
      NSLog(@"CR not found");
    }

    return TRUE;
  }
  
}

- (void)writeAlbumArt:(NSData *)albumArtData {
  if (![[NSFileManager defaultManager] fileExistsAtPath:self.albumArtFilename]) {
    [[NSFileManager defaultManager] createFileAtPath:self.albumArtFilename
                                            contents:nil
                                          attributes:nil];
  }
  NSFileHandle *handle = [NSFileHandle fileHandleForUpdatingAtPath:self.albumArtFilename];
  [handle seekToEndOfFile];
  [handle writeData: albumArtData];
  [handle closeFile];
}
@end
