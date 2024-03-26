import express, { Application as ExpressApplication } from "express";
import { createServer as createHttpServer, Server as HttpServer } from "http";
import { createContainer, InjectionMode, asValue, asClass } from "awilix";
import MediaClientRepositoryImplementation from "./implementations/media-client-repository";
import serverConfiguration from "./configurations/serverConfiguration";
import MediaClientRepository from "./abstractions/media-client-repository";
import { wrapResultAsync } from "./utils/result";

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
      response.json(await wrapResultAsync(async () => {
        const meetingId = request.params.meetingId;

        const client = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

        return await client.getMeetingInfo(meetingId);
      }));
    });

    this._expressApplication.post("/meetings/start", async (request, response) => {
      response.json(await wrapResultAsync(async () => {
        const username = request.headers["x-username"] as string;

        const client = this._mediaClientRepository.pickMediaClient();

        const { meetingId } = await client.startMeeting(username);

        this._mediaClientRepository.addMeetingToLookupTable(meetingId, client);

        return { meetingId };
      }));
    });

    this._expressApplication.post("/meetings/:meetingId/end", async (request, response) => {
      response.json(await wrapResultAsync(async () => {
        const username = request.headers["x-username"] as string;
        const meetingId = request.params.meetingId;

        const client = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

        const result = await client.endMeeting(meetingId, username);

        this._mediaClientRepository.removeMeetingFromLookupTable(meetingId);

        return result;
      }));
    });
  }

  private bootAttendeeSection() {
    this._expressApplication.post("/meetings/:meetingId/join", async (request, response) => {
      response.json(await wrapResultAsync(async () => {
        const username = request.headers["x-username"] as string;
        const meetingId = request.params.meetingId;

        const client = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

        return await client.joinMeeting(meetingId, username);
      }));
    });

    this._expressApplication.post("/meetings/:meetingId/connect", async (request, response) => {
      response.json(await wrapResultAsync(async () => {
        const username = request.headers["x-username"] as string;
        const meetingId = request.params.meetingId;

        const client = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

        const { transportType, dtlsParameters } = request.body;

        return await client.connectTransport(meetingId, username, transportType, dtlsParameters);
      }));
    });

    this._expressApplication.post("/meetings/:meetingId/leave", async (request, response) => {
      response.json(await wrapResultAsync(async () => {
        const username = request.headers["x-username"] as string;
        const meetingId = request.params.meetingId;

        const client = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

        return await client.leaveMeeting(meetingId, username);
      }));
    });
  }

  private bootProducerSection() {
    this._expressApplication.post("/meetings/:meetingId/produceMedia", async (request, response) => {
      response.json(await wrapResultAsync(async () => {
        const username = request.headers["x-username"] as string;
        const meetingId = request.params.meetingId;

        const client = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

        const { appData, rtpParameters } = request.body;

        return await client.produceMedia(meetingId, username, appData, rtpParameters);
      }));
    });

    this._expressApplication.post("/meetings/:meetingId/closeProducer", async (request, response) => {
      response.json(await wrapResultAsync(async () => {
        const username = request.headers["x-username"] as string;
        const meetingId = request.params.meetingId;

        const client = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

        const { producerType } = request.body;

        return await client.closeProducer(meetingId, username, producerType);
      }));
    });

    this._expressApplication.post("/meetings/:meetingId/pauseProducer", async (request, response) => {
      response.json(await wrapResultAsync(async () => {
        const username = request.headers["x-username"] as string;
        const meetingId = request.params.meetingId;

        const client = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

        const { producerType } = request.body;

        return await client.pauseProducer(meetingId, username, producerType);
      }));
    });

    this._expressApplication.post("/meetings/:meetingId/resumeProducer", async (request, response) => {
      response.json(await wrapResultAsync(async () => {
        const username = request.headers["x-username"] as string;
        const meetingId = request.params.meetingId;

        const client = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

        const { producerType } = request.body;

        return await client.resumeProducer(meetingId, username, producerType);
      }));
    });
  }

  private bootConsumerSection() {
    this._expressApplication.post("/meetings/:meetingId/consumeMedia", async (request, response) => {
      response.json(await wrapResultAsync(async () => {
        const username = request.headers["x-username"] as string;
        const meetingId = request.params.meetingId;

        const client = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

        const { producerId, rtpCapabilities } = request.body;

        return await client.consumeMedia(meetingId, username, producerId, rtpCapabilities);
      }));
    });

    this._expressApplication.post("/meetings/:meetingId/pauseConsumer", async (request, response) => {
      response.json(await wrapResultAsync(async () => {
        const username = request.headers["x-username"] as string;
        const meetingId = request.params.meetingId;

        const client = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

        const { consumerId } = request.body;

        return await client.pauseConsumer(meetingId, username, consumerId);
      }));
    });

    this._expressApplication.post("/meetings/:meetingId/resumeConsumer", async (request, response) => {
      response.json(await wrapResultAsync(async () => {
        const username = request.headers["x-username"] as string;
        const meetingId = request.params.meetingId;

        const client = this._mediaClientRepository.getMediaClientByMeetingId(meetingId);

        const { consumerId } = request.body;

        return await client.resumeConsumer(meetingId, username, consumerId);
      }));
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
      console.log(`Server is running at http://${serverConfiguration.server.listenIp}:${serverConfiguration.server.listenPort}`);
    });
  }
}

MediaBrokerApplication.main();