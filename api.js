import axios from "axios";

const baseURL = "http://192.168.0.53:8123";
const apiEndpoint = `${baseURL}/api/`;
const switchEntityID = "switch.sonoff_100095b6e6_1";

const AUTH_TOKEN =
  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI5MDg0Y2M2Nzc3ZGQ0ZmYwOGI3ZmFkYzdmNGQ3NDFlMyIsImlhdCI6MTY3MTQ2MDM5NCwiZXhwIjoxOTg2ODIwMzk0fQ.U2cn6LOrWCtosH_AYoWRYzqTwVeFjHzGzMb2fSRTj08";

export const api = axios.create({
  baseURL: apiEndpoint,
  timeout: 5000,
  headers: {
    "Content-type": "application/json",
    Authorization: AUTH_TOKEN,
  },
});

export async function getSwitchState() {
  const res = await api.get(`/states/${switchEntityID}`, {});
  return res.data;
}

export async function getPumpOffDatetimeState() {
  const res = await api.get("/states/input_datetime.pump_off_time", {});
  return res.data;
}

export async function getRenderedTemplate(templateString) {
  const res = await api.post("/template", {
    template: templateString,
  });
  return res.data;
}

export async function turnOffPump() {
  const res = await api.post("/services/switch/turn_off", {
    entity_id: switchEntityID,
  });
  return res.data;
}

export async function turnOnPump() {
  const res = await api.post("/services/switch/turn_on", {
    entity_id: switchEntityID,
  });
  return res.data;
}
export async function setPumpOffTime(dateTime) {
  const res = await api.post("/services/input_datetime/set_datetime", {
    entity_id: "input_datetime.pump_off_time",
    datetime: dateTime,
  });
  return res.data;
}
