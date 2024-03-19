export default {
  server: {
    listenIp: "0.0.0.0",
    listenPort: process.env.PORT || 8100
  },
  mediaServers: [
    "http://localhost:8200"
  ]
}