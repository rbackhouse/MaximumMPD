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

#import "BonjourListener.h"
#import <arpa/inet.h>

@implementation BonjourListener

- (id)init {
  self = [super init];

  self.services = [[NSMutableArray alloc] init];
  self.serviceBrowser = [[NSNetServiceBrowser alloc] init];
  [self.serviceBrowser setDelegate:self];
  [self.serviceBrowser scheduleInRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];

  return self;
}

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(listen:(NSString *)type port:(NSString *)domain) {
  [self.serviceBrowser searchForServicesOfType:type inDomain:domain];
}

RCT_EXPORT_METHOD(stopListening) {
  [self.serviceBrowser stop];
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"OnDiscover"];
}

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (void)netServiceBrowserWillSearch:(NSNetServiceBrowser *)browser {}

- (void)netServiceBrowserDidStopSearch:(NSNetServiceBrowser *)browser {}

- (void)netServiceBrowser:(NSNetServiceBrowser *)browser didNotSearch:(NSDictionary *)errorDict {}

- (void)netServiceBrowser:(NSNetServiceBrowser *)browser didFindService:(NSNetService *)aNetService moreComing:(BOOL)moreComing {
  [self resolveSerivce:aNetService];
}

- (void)netServiceBrowser:(NSNetServiceBrowser *)browser didRemoveService:(NSNetService *)aNetService moreComing:(BOOL)moreComing {
  [self sendEventWithName:@"OnDiscover" body:@{@"type": @"remove", @"name": [aNetService name]}];
}

- (void)netServiceDidResolveAddress:(NSNetService *)aNetService {
    NSString * ipAddress = [self findIPAddress:[aNetService addresses]];
    if (ipAddress != nil) {
      NSLog(@"didResolve  %@ %@ %@ %@", [aNetService name], [aNetService hostName], [NSNumber numberWithInteger:aNetService.port], ipAddress);

      [self sendEventWithName:@"OnDiscover" body:@{@"type": @"add", @"name": [aNetService name], @"hostname": [aNetService hostName], @"port": [NSNumber numberWithInteger:aNetService.port], @"ipAddress": ipAddress}];
    }
    [self.services removeObject:aNetService];
    [aNetService removeFromRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
    [aNetService stop];
}

- (void)netService:(NSNetService *)aNetService didNotResolve:(NSDictionary *)errorDict {
  NSLog(@"didNotResolve  %@ error: %@", [aNetService name], errorDict);
  NSNumber *errorCode = errorDict[NSNetServicesErrorCode];
  NSInteger error = [errorCode integerValue];
  if (error == NSNetServicesTimeoutError) {
    [self resolveSerivce:aNetService];
  }
}

- (NSString*)findIPAddress:(NSArray<NSData *> *)addresses {
  char addressBuffer[INET6_ADDRSTRLEN];

  for (NSData *data in addresses) {
    memset(addressBuffer, 0, INET6_ADDRSTRLEN);

    typedef union {
      struct sockaddr sa;
      struct sockaddr_in ipv4;
      struct sockaddr_in6 ipv6;
    } ip_socket_address;

    ip_socket_address *socketAddress = (ip_socket_address *)[data bytes];

    if (socketAddress && socketAddress->sa.sa_family == AF_INET) {
      const char *addressStr = inet_ntop(socketAddress->sa.sa_family,
                                         (void *)&(socketAddress->ipv4.sin_addr),
                                         addressBuffer,
                                         sizeof(addressBuffer));
      return [NSString stringWithUTF8String:addressStr];
    }
  }
  return nil;
}

- (void)resolveSerivce:(NSNetService *)aNetService {
  [aNetService setDelegate:self];
  [aNetService resolveWithTimeout:5.0];
  [self.services addObject:aNetService];
  [aNetService scheduleInRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
  NSLog(@"didDiscover  %@", [aNetService name]);
  
  [self sendEventWithName:@"OnDiscover" body:@{@"type": @"discover", @"name": [aNetService name]}];
}

@end
