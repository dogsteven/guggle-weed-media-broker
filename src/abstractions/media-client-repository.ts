import MediaClient from "../entites/media-client";
import { Result } from "../utils/result";

export default interface MediaClientRepository {
  pickMediaClient(): MediaClient;

  getMediaClientByMeetingId(meetingId: any): Result<MediaClient>;

  addMeetingToLookupTable(meetingId: any, mediaClient: MediaClient): Result<any>;

  removeMeetingFromLookupTable(meetingId: any): Result<any>
}