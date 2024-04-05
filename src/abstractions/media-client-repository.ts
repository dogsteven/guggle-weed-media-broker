import MediaClient from "../entites/media-client";

export default interface MediaClientRepository {
  pick(): { client: MediaClient, index: number };
  get(meetingId: any): MediaClient;
  set(meetingId: any, index: number): void;
  remove(meetingId: any): void;
}