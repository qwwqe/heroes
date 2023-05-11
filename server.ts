import http from "http";
import app from "./app";

const server = http.createServer(app.callback());

server.listen(8080, "0.0.0.0");
