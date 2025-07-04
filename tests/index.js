import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  stages: [{ duration: "5s", target: 100 }],
};

export default function () {
  const endpoint = process.env.SERVER_ENDPOINT;

  let res = http.get(endpoint);

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  sleep(0.1);
}
