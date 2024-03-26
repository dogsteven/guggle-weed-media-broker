import MediaClient from "../entites/media-client";
import MediaClientRepository from "../abstractions/media-client-repository";
import serverConfiguration from "../configurations/serverConfiguration";
import MediaClientImplementation from "../entites/media-client";

export default class MediaClientRepositoryImplementation implements MediaClientRepository {
  private readonly _clients: MediaClient[];
  private _currentClientIndex: number;

  private readonly _lookupTable: Map<any, MediaClient>;

  public constructor() {
    this._clients = serverConfiguration.mediaServers.map((url) => new MediaClientImplementation(url));
    this._currentClientIndex = 0;
    this._lookupTable = new Map<any, MediaClient>();
  }

  public pickMediaClient(): MediaClient {
    const client = this._clients[this._currentClientIndex];

    this._currentClientIndex = (this._currentClientIndex + 1) % this._clients.length;

    return client;
  }

  public getMediaClientByMeetingId(meetingId: any): MediaClient {
    if (!this._lookupTable.has(meetingId)) {
      throw `There is no meeting with id ${meetingId}`;
    }

    return this._lookupTable.get(meetingId);
  }
  
  public addMeetingToLookupTable(meetingId: any, mediaClient: MediaClient): void {
    if (this._lookupTable.has(meetingId)) {
      throw `Meeting with id ${meetingId} already presents`;
    }

    this._lookupTable.set(meetingId, mediaClient);
  }

  public removeMeetingFromLookupTable(meetingId: any): void {
    if (!this._lookupTable.has(meetingId)) {
      throw `There is no meeting with id ${meetingId}`;
    }

    this._lookupTable.delete(meetingId);
  }
}