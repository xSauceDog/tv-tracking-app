import { defineParams } from "@sveltejs/kit/params";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Case-insensitive on purpose: the page redirects /@TJ to /@tj instead of 404ing.
const USERNAME = /^[a-z0-9_]{3,20}$/i;

export const params = defineParams({
	uuid: (param) => (UUID.test(param) ? param : undefined),
	username: (param) => (USERNAME.test(param) ? param : undefined)
});
