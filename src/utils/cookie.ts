import cookie from "js-cookie";

export const getCookie = (key: string) => {
  return cookie.get(key);
};

export const setCookie = (key: string, value: string) => {
  cookie.set(key, value);
};