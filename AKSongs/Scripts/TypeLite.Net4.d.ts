
 
 

 

/// <reference path="Enums.ts" />

declare module AKSongs.Controllers.NotificationsController {
	interface NotificationDto {
		song: string;
		age: number;
	}
}
declare module AKSongs.Models {
	interface Song {
		id?: string;
		name: string;
		lyrics: string;
		melody: string;
		author: string;
		year: number;
		modified?: number;
		created?: number;
	}
}


