import { defineParams } from "@sveltejs/kit/params";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const params = defineParams({
	uuid: (param) => (UUID.test(param) ? param : undefined)
});
