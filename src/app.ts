import express, { Application as ExpressApplication } from "express";
import { createServer as createHttpServer, Server as HttpServer } from "http";
import { createContainer, InjectionMode, asValue, asClass } from "awilix";
import MediaClientRepositoryImplementation from "./implementations/media-client-repository";
import serverConfiguration from "./configurations/serverConfiguration";
import MediaClientRepository from "./abstractions/media-client-repository";

class MediaBrokerApplication {
  private readonly _expressApplication: ExpressApplication;
  private readonly _httpsServer: HttpServer;
  private readonly _mediaClientRepository: MediaClientRepository

  public constructor(services: {
    expressApplication: ExpressApplication,
    httpsServer: HttpServer,
    mediaClientRepository: MediaClientRepository
  }) {
    this._expressApplication = services.expressApplication;
    this._httpsServer = services.httpsServer;
    this._mediaClientRepository = services.mediaClientRepository;
  }

  private static async buildContainer() {
    const container = createContainer({
      injectionMode: InjectionMode.PROXY,
      strict: true
    });

    const expressApplication = express();

    const httpsServer = createHttpServer(expressApplication);

    const mediaClientRepository = new MediaClientRepositoryImplementation();

    container.register({
      expressApplication: asValue(expressApplication),
      httpsServer: asValue(httpsServer),
      mediaClientRepository: asValue(mediaClientRepository)
    });

    container.register({
      application: asClass(MediaBrokerApplication).singleton()
    });

    return container;
  }

  public static async main() {
    const container = await this.buildContainer();

    const application = container.resolve("application") as MediaBrokerApplication;

    await application.boot();
    await application.listen();
  }

  private bootMeetingSection() {
    this._expressApplication.get("/meetings/:meetingId", async (request, response) => {
      const meetingId = request.params.meetingId;

      const clientResult = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

      if (clientResult.status === "failed") {
        response.json(clientResult);
        return;
      }

      const client = clientResult.data;

      response.json(await client.getMeetingInfo(meetingId));
    });

    this._expressApplication.post("/meetings/start", async (request, response) => {
      const username = request.headers["x-username"] as string;

      const client = this._mediaClientRepository.pickMediaClient();

      const callResult = await client.startMeeting(username);

      if (callResult.status === "success") {
        this._mediaClientRepository.addMeetingToLookupTable(callResult.data.meetingId, client);
      }

      response.json(callResult);
    });

    this._expressApplication.post("/meetings/:meetingId/end", async (request, response) => {
      const username = request.headers["x-username"] as string;
      const meetingId = request.params.meetingId;

      const clientResult = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

      if (clientResult.status === "failed") {
        response.json(clientResult);
        return;
      }

      const client = clientResult.data;

      const callResult = await client.endMeeting(meetingId, username);

      if (callResult.status === "success") {
        this._mediaClientRepository.removeMeetingFromLookupTable(meetingId);
      }

      response.json(callResult);
    });
  }

  private bootAttendeeSection() {
    this._expressApplication.post("/meetings/:meetingId/join", async (request, response) => {
      const username = request.headers["x-username"] as string;
      const meetingId = request.params.meetingId;

      const clientResult = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

      if (clientResult.status === "failed") {
        response.json(clientResult);
        return;
      }

      const client = clientResult.data;

      response.json(await client.joinMeeting(meetingId, username));
    });

    this._expressApplication.post("/meetings/:meetingId/connect", async (request, response) => {
      const username = request.headers["x-username"] as string;
      const meetingId = request.params.meetingId;

      const clientResult = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

      if (clientResult.status === "failed") {
        response.json(clientResult);
        return;
      }

      const client = clientResult.data;

      const { transportType, dtlsParameters } = request.body;

      response.json(await client.connectTransport(meetingId, username, transportType, dtlsParameters));
    });

    this._expressApplication.post("/meetings/:meetingId/leave", async (request, response) => {
      const username = request.headers["x-username"] as string;
      const meetingId = request.params.meetingId;

      const clientResult = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

      if (clientResult.status === "failed") {
        response.json(clientResult);
        return;
      }

      const client = clientResult.data;

      response.json(await client.leaveMeeting(meetingId, username));
    });
  }

  private bootProducerSection() {
    this._expressApplication.post("/meetings/:meetingId/produceMedia", async (request, response) => {
      const username = request.headers["x-username"] as string;
      const meetingId = request.params.meetingId;

      const clientResult = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

      if (clientResult.status === "failed") {
        response.json(clientResult);
        return;
      }

      const client = clientResult.data;

      const { appData, rtpParameters } = request.body;

      response.json(await client.produceMedia(meetingId, username, appData, rtpParameters));
    });

    this._expressApplication.post("/meetings/:meetingId/closeProducer", async (request, response) => {
      const username = request.headers["x-username"] as string;
      const meetingId = request.params.meetingId;

      const clientResult = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

      if (clientResult.status === "failed") {
        response.json(clientResult);
        return;
      }

      const client = clientResult.data;

      const { producerType } = request.body;

      response.json(await client.closeProducer(meetingId, username, producerType));
    });

    this._expressApplication.post("/meetings/:meetingId/pauseProducer", async (request, response) => {
      const username = request.headers["x-username"] as string;
      const meetingId = request.params.meetingId;

      const clientResult = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

      if (clientResult.status === "failed") {
        response.json(clientResult);
        return;
      }

      const client = clientResult.data;

      const { producerType } = request.body;

      response.json(await client.pauseProducer(meetingId, username, producerType));
    });

    this._expressApplication.post("/meetings/:meetingId/resumeProducer", async (request, response) => {
      const username = request.headers["x-username"] as string;
      const meetingId = request.params.meetingId;

      const clientResult = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

      if (clientResult.status === "failed") {
        response.json(clientResult);
        return;
      }

      const client = clientResult.data;

      const { producerType } = request.body;

      response.json(await client.resumeProducer(meetingId, username, producerType));
    });
  }

  private bootConsumerSection() {
    this._expressApplication.post("/meetings/:meetingId/consumeMedia", async (request, response) => {
      const username = request.headers["x-username"] as string;
      const meetingId = request.params.meetingId;

      const clientResult = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

      if (clientResult.status === "failed") {
        response.json(clientResult);
        return;
      }

      const client = clientResult.data;

      const { producerId, rtpCapabilities } = request.body;

      response.json(await client.consumeMedia(meetingId, username, producerId, rtpCapabilities));
    });

    this._expressApplication.post("/meetings/:meetingId/pauseConsumer", async (request, response) => {
      const username = request.headers["x-username"] as string;
      const meetingId = request.params.meetingId;

      const clientResult = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

      if (clientResult.status === "failed") {
        response.json(clientResult);
        return;
      }

      const client = clientResult.data;

      const { consumerId } = request.body;

      response.json(await client.pauseConsumer(meetingId, username, consumerId));
    });

    this._expressApplication.post("/meetings/:meetingId/resumeConsumer", async (request, response) => {
      const username = request.headers["x-username"] as string;
      const meetingId = request.params.meetingId;

      const clientResult = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

      if (clientResult.status === "failed") {
        response.json(clientResult);
        return;
      }

      const client = clientResult.data;

      const { consumerId } = request.body;

      response.json(await client.resumeConsumer(meetingId, username, consumerId));
    });
  }

  private async boot() {
    this.bootMeetingSection();
    this.bootAttendeeSection();
    this.bootProducerSection();
    this.bootConsumerSection();
  }

  private async listen() {
    this._httpsServer.listen(serverConfiguration.server.listenPort, () => {
      console.log(`Server is running at http://${serverConfiguration.server.listenPort}:${serverConfiguration.server.listenPort}`);
    });
  }
}

MediaBrokerApplication.main();