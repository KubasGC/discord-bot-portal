import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, params }) {
	const fetchOptions = { credentials: 'include' };
	const categoriesResponse = await fetch(`/api/admin/guilds/${params.guild}/categories`, fetchOptions);
	const isJSON = categoriesResponse.headers.get('Content-Type')?.includes('json');
	const categoriesBody = isJSON ? await categoriesResponse.json() : await categoriesResponse.text();
	if (!categoriesResponse.ok) {
		error(categoriesResponse.status, isJSON ? JSON.stringify(categoriesBody) : categoriesBody);
	}

	const panelsResponse = await fetch(`/api/admin/guilds/${params.guild}/panels`, fetchOptions);
	const panels = panelsResponse.ok ? await panelsResponse.json() : [];

	return {
		categories: categoriesBody,
		channels: await (
			await fetch(`/api/admin/guilds/${params.guild}/data?query=channels.cache`, fetchOptions)
		).json(),
		panels
	};
}
