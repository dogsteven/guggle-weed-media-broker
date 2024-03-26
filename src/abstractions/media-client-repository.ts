import MediaClient from "../entites/media-client";

export default interface MediaClientRepository {
  pickMediaClient(): MediaClient;

  getMediaClientByMeetingId(meetingId: any): MediaClient;

  addMeetingToLookupTable(meetingId: any, mediaClient: MediaClient): void;

  removeMeetingFromLookupTable(meetingId: any): void;
}