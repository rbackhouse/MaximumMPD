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

#import "UPnP.h"

@implementation UPnP

- (id)init {
  self = [super init];
  self.servers = [[NSMutableDictionary alloc] init];
  self.renderers = [[NSMutableDictionary alloc] init];

  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onPause) name:UIApplicationDidEnterBackgroundNotification object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onResume) name:UIApplicationWillEnterForegroundNotification object:nil];
  return self;
}

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(startListening) {
  [[UPPDiscovery sharedInstance] addBrowserObserver:self];
  [[UPPDiscovery sharedInstance] startBrowsingForServices:@"urn:schemas-upnp-org:device:MediaServer:1"];
  for (UPPBasicDevice *device in [UPPDiscovery sharedInstance].availableDevices) {
    if ([device isKindOfClass:[UPPMediaServerDevice class]]) {
      NSLog(@"Available Device: %@", device);
      [self sendEventWithName:@"OnUPnPDiscover" body:@{@"action": @"find", @"name": device.friendlyName, @"udn": device.udn, @"type": @"mediaserver"}];
    }
  }
}

RCT_EXPORT_METHOD(stopListening) {
  [[UPPDiscovery sharedInstance] stopBrowsingForServices];
  [[UPPDiscovery sharedInstance] removeBrowserObserver:self];
}

RCT_EXPORT_METHOD(browse:(NSString *)udn objectid:(NSString *)objectId resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  UPPMediaServerDevice* server = [self.servers valueForKey:udn];
  if (server == nil) {
    NSString *description = [NSString stringWithFormat:@"No UPnP Server found for %@", udn];
    reject(@"browse_failure", description, nil);
    return;
  }

  UPPResponseBlock block = ^(NSDictionary *response, NSError *error) {
      if (response) {
        NSArray *array = response[@"Result"];
        NSMutableArray *items = [[NSMutableArray alloc] init];

        for (id object in array) {
          NSMutableArray *resources = [[NSMutableArray alloc] init];
          NSMutableArray *artworkResources = [[NSMutableArray alloc] init];
          UPPMediaItem *mediaItem = (UPPMediaItem *)object;
          
          for (UPPMediaItemResource *res in mediaItem.resources) {
            NSDictionary *resource = @{
              @"numberOfAudioChannels" : res.numberOfAudioChannels == nil ? @"" : res.numberOfAudioChannels,
              @"bitrate" : res.bitrate == nil ? @"" : res.bitrate,
              @"duration" : res.duration == nil ? @"" : res.duration,
              @"sampleFrequency" : res.sampleFrequency == nil ? @"" : res.sampleFrequency,
              @"protocolInfo" : res.protocolInfo,
              @"itemSize" : res.itemSize == nil ? @"" : res.itemSize,
              @"resourceURLString" : res.resourceURLString
            };

            [resources addObject:resource];
          }
          
          for (UPPMediaItemArtwork *artres in mediaItem.artworkResources) {
            NSDictionary *artResource = @{
              @"url" : artres.url
            };

            [artworkResources addObject:artResource];
          }
          
          NSDictionary *item = @{
            @"objectID" : mediaItem.objectID,
            @"parentID" : mediaItem.parentID,
            @"title" : mediaItem.itemTitle,
            @"albumTitle" : mediaItem.albumTitle == nil ? @"" : mediaItem.albumTitle,
            @"artist" : mediaItem.artist == nil ? @"" : mediaItem.artist,
            @"childCount" : mediaItem.childCount == nil ? @"0" : mediaItem.childCount,
            @"genre" : mediaItem.genre == nil ? @"" : mediaItem.genre,
            @"date" : mediaItem.date == nil ? @"" : mediaItem.date,
            @"isContainer" : mediaItem.isContainer == YES ? @"TRUE" : @"FALSE",
            @"trackNumber" : mediaItem.trackNumber == nil ? @"0" : mediaItem.trackNumber,
            @"albumArtURL" : mediaItem.albumArtURLString == nil ? @"" : mediaItem.albumArtURLString,
            @"class" : mediaItem.objectClass,
            @"resources" : resources,
            @"artworkResources" : artworkResources
          };

          [items addObject:item];
        }
        resolve(items);
      } else {
        NSLog(@"Error fetching results: %@", error);
        reject(@"browse_failure", @"browse failure", error);
      }
  };
  [[server contentDirectoryService]
       browseWithObjectID:objectId
       browseFlag:BrowseDirectChildren
       filter:@"*"
       startingIndex:@0
       requestedCount:@0
       sortCritera:nil
       completion:block];
}

RCT_EXPORT_METHOD(search:(NSString *)udn containerId:(NSString *)containerId searchCriteria:(NSString *)searchCriteria filter:(NSString *)filter resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  UPPMediaServerDevice* server = [self.servers valueForKey:udn];
  if (server == nil) {
    NSString *description = [NSString stringWithFormat:@"No UPnP Server found for %@", udn];
    reject(@"search_failure", description, nil);
    return;
  }

  UPPResponseBlock block = ^(NSDictionary *response, NSError *error) {
      if (response) {
        NSArray *array = response[@"Result"];
        NSMutableArray *items = [[NSMutableArray alloc] init];

        for (id object in array) {
          //NSMutableArray *resources = [[NSMutableArray alloc] init];
          //NSMutableArray *artworkResources = [[NSMutableArray alloc] init];
          UPPMediaItem *mediaItem = (UPPMediaItem *)object;
          /*
          for (UPPMediaItemResource *res in mediaItem.resources) {
            NSDictionary *resource = @{
              @"numberOfAudioChannels" : res.numberOfAudioChannels == nil ? @"" : res.numberOfAudioChannels,
              @"bitrate" : res.bitrate == nil ? @"" : res.bitrate,
              @"duration" : res.duration == nil ? @"" : res.duration,
              @"sampleFrequency" : res.sampleFrequency == nil ? @"" : res.sampleFrequency,
              @"protocolInfo" : res.protocolInfo,
              @"itemSize" : res.itemSize == nil ? @"" : res.itemSize,
              @"resourceURLString" : res.resourceURLString
            };

            [resources addObject:resource];
          }
          
          for (UPPMediaItemArtwork *artres in mediaItem.artworkResources) {
            NSDictionary *artResource = @{
              @"url" : artres.url
            };

            [artworkResources addObject:artResource];
          }
          */
          NSDictionary *item = @{
            @"objectID" : mediaItem.objectID,
            @"parentID" : mediaItem.parentID,
            @"title" : mediaItem.itemTitle,
            //@"albumTitle" : mediaItem.albumTitle == nil ? @"" : mediaItem.albumTitle,
            //@"artist" : mediaItem.artist == nil ? @"" : mediaItem.artist,
            //@"childCount" : mediaItem.childCount == nil ? @"0" : mediaItem.childCount,
            //@"genre" : mediaItem.genre == nil ? @"" : mediaItem.genre,
            //@"date" : mediaItem.date == nil ? @"" : mediaItem.date,
            //@"isContainer" : mediaItem.isContainer == YES ? @"TRUE" : @"FALSE",
            //@"trackNumber" : mediaItem.trackNumber == nil ? @"0" : mediaItem.trackNumber,
            @"albumArtURL" : mediaItem.albumArtURLString == nil ? @"" : mediaItem.albumArtURLString,
            //@"class" : mediaItem.objectClass,
            //@"resources" : resources,
            //@"artworkResources" : artworkResources
          };

          [items addObject:item];
        }
        resolve(items);
      } else {
        NSLog(@"Error fetching results: %@", error);
        reject(@"browse_failure", @"browse failure", error);
      }
  };
  [[server contentDirectoryService]
      searchWithContainerID:containerId
      searchCriteria:searchCriteria
      filter:filter
      startingIndex:@0
      requestedCount:@0
      sortCritera:nil
      completion:block];
}

- (void) onPause {
  
}

- (void) onResume {
}

#pragma mark - UPPDiscoveryDelegate

- (void)discovery:(UPPDiscovery *)discovery didFindDevice:(UPPBasicDevice *)device {
  if ([device isKindOfClass:[UPPMediaRendererDevice class]]) {
    UPPMediaRendererDevice* renderer = (UPPMediaRendererDevice *)device;
    if ([self.renderers valueForKey:renderer.udn] != nil) {
      return;
    }
    [self.renderers setObject:renderer forKey:renderer.udn];
    NSLog(@"renderer: %@", device);
    [self sendEventWithName:@"OnUPnPDiscover" body:@{@"action": @"find", @"name": device.friendlyName, @"udn": device.udn, @"type": @"mediarenderer"}];
  } else if ([device isKindOfClass:[UPPMediaServerDevice class]]) {
    UPPMediaServerDevice* server = (UPPMediaServerDevice *)device;
    if ([self.servers valueForKey:device.udn] != nil) {
      return;
    }
    NSLog(@"server: %@", device.deviceType);
    [self.servers setObject:server forKey:server.udn];
    [self sendEventWithName:@"OnUPnPDiscover" body:@{@"action": @"find", @"name": device.friendlyName, @"udn": device.udn, @"type": @"mediaserver"}];
  }
}

- (void)discovery:(UPPDiscovery *)discovery didRemoveDevice:(UPPBasicDevice *)device {
  if ([device isKindOfClass:[UPPMediaRendererDevice class]]) {
    UPPMediaRendererDevice* renderer = (UPPMediaRendererDevice *)device;
    if ([self.renderers valueForKey:renderer.udn] == nil) {
        return;
    }
    [self.renderers removeObjectForKey:renderer.udn];
    [self sendEventWithName:@"OnUPnPDiscover" body:@{@"action": @"remove", @"name": device.friendlyName, @"udn": device.udn, @"type": @"mediarenderer"}];
  } else if ([device isKindOfClass:[UPPMediaServerDevice class]]) {
    UPPMediaServerDevice* server = (UPPMediaServerDevice *)device;
    if ([self.servers valueForKey:server.udn] == nil) {
        return;
    }
    [self.servers removeObjectForKey:server.udn];
    [self sendEventWithName:@"OnUPnPDiscover" body:@{@"action": @"remove", @"name": device.friendlyName, @"udn": device.udn, @"type": @"mediaserver"}];
  }
}

#pragma mark - UPPEventServerDelegate

- (void)eventReceived:(NSDictionary *)event {

}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"OnUPnPDiscover"];
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

@end

