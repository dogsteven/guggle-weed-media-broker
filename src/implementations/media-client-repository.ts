import MediaClient from "../entites/media-client";
import MediaClientRepository from "../abstractions/media-client-repository";
import serverConfiguration from "../configurations/serverConfiguration";

export default class MediaClientRepositoryImplementation implements MediaClientRepository {
  private static readonly _clients = serverConfiguration.mediaServers.map((url) => new MediaClient(url));

  private _currentClientIndex: number;

  private readonly _lookupTable: Map<any, number>;

  public constructor() {
    this._currentClientIndex = 0;
    this._lookupTable = new Map<any, number>();
  }

  public pick(): { client: MediaClient, index: number } {
    const client = MediaClientRepositoryImplementation._clients[this._currentClientIndex];
    const index = this._currentClientIndex;

    this._currentClientIndex = (this._currentClientIndex + 1) % serverConfiguration.mediaServers.length;

    return { client, index };
  }

  public get(meetingId: any): MediaClient {
    if (!this._lookupTable.has(meetingId)) {
      throw new Error(`There is no meeting with id ${meetingId}`);
    }

    const index = this._lookupTable.get(meetingId);

    return MediaClientRepositoryImplementation._clients[index];
  }
  
  public set(meetingId: any, index: number): void {
    if (this._lookupTable.has(meetingId)) {
      throw new Error(`Meeting with id ${meetingId} already presents`);
    }

    this._lookupTable.set(meetingId, index);
  }

  public remove(meetingId: any): void {
    if (!this._lookupTable.has(meetingId)) {
      throw new Error(`There is no meeting with id ${meetingId}`);
    }

    this._lookupTable.delete(meetingId);
  }
}