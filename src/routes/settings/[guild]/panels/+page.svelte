<script>
	import { run, preventDefault } from 'svelte/legacy';

	import { page } from '$app/stores';
	import MultiSelect from 'svelte-multiselect';
	import emoji from 'emoji-name-map';
	import Required from '$components/Required.svelte';
	import ErrorBox from '$components/ErrorBox.svelte';
	/**
	 * @typedef {Object} Props
	 * @property {import('./$types').PageData} data
	 */

	/** @type {Props} */
	let { data } = $props();

	let { categories, channels, panels } = $state(data);
	channels = channels.filter((c) => c.type === 0); // text
	let error = $state(null);
	let loading = $state(false);
	let sendingPanelId = $state(null);
	let editingPanel = $state(null);
	let showForm = $state(false);
	let panel = $state({
		name: '',
		categories: [],
		description: '',
		image: '',
		title: '',
		type: 'BUTTON',
		thumbnail: ''
	});

	let selectedCategories = $state([]);
	const categoryOptions = categories.reduce((acc, c) => {
		acc[(emoji.get(c.emoji) ?? '') + c.name] = c.id;
		return acc;
	}, {});

	const getCategoryName = (id) => {
		const cat = categories.find((c) => c.id === id);
		return cat ? (emoji.get(cat.emoji) ?? '') + cat.name : `Category ${id}`;
	};

	const resetForm = () => {
		panel = {
			name: '',
			categories: [],
			description: '',
			image: '',
			title: '',
			type: 'BUTTON',
			thumbnail: ''
		};
		selectedCategories = [];
		editingPanel = null;
		showForm = false;
	};

	const startEdit = (p) => {
		editingPanel = p;
		const cats = typeof p.categories === 'string' ? JSON.parse(p.categories) : p.categories;
		panel = {
			name: p.name,
			categories: cats,
			description: p.description || '',
			image: p.image || '',
			title: p.title || '',
			type: p.type,
			thumbnail: p.thumbnail || ''
		};
		selectedCategories = cats.map((id) => {
			const cat = categories.find((c) => c.id === id);
			return cat ? (emoji.get(cat.emoji) ?? '') + cat.name : null;
		}).filter(Boolean);
		showForm = true;
	};

	const submit = async () => {
		try {
			error = null;
			loading = true;
			const json = { ...panel };
			json.categories = selectedCategories.map((name) => categoryOptions[name]);
			
			const isEdit = editingPanel !== null;
			if (isEdit) json.id = editingPanel.id;

			const url = `/api/admin/guilds/${$page.params.guild}/panels`;
			const response = await fetch(url, {
				method: isEdit ? 'PUT' : 'POST',
				body: JSON.stringify(json),
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json; charset=UTF-8'
				}
			});
			const body = await response.json();
			if (!response.ok) throw body;
			else window.location.reload();
		} catch (err) {
			loading = false;
			error = err;
			window.scroll({
				top: 0,
				behavior: 'smooth'
			});
		}
	};

	const deletePanel = async (panelId) => {
		if (!confirm('Are you sure you want to delete this panel? All sent messages will also be deleted.')) return;
		try {
			error = null;
			const url = `/api/admin/guilds/${$page.params.guild}/panels`;
			const response = await fetch(url, {
				method: 'DELETE',
				body: JSON.stringify({ id: panelId }),
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json; charset=UTF-8'
				}
			});
			const body = await response.json();
			if (!response.ok) throw body;
			else window.location.reload();
		} catch (err) {
			error = err;
		}
	};

	const sendPanel = async (panelId, channelId) => {
		try {
			error = null;
			sendingPanelId = panelId;
			const url = `/api/admin/guilds/${$page.params.guild}/panels/send`;
			const response = await fetch(url, {
				method: 'POST',
				body: JSON.stringify({ panelId, channelId }),
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json; charset=UTF-8'
				}
			});
			const body = await response.json();
			if (!response.ok) throw body;
			else window.location.reload();
		} catch (err) {
			error = err;
		} finally {
			sendingPanelId = null;
		}
	};

	run(() => {
		panel.type =
			panel.categories.length > 5
				? 'MENU'
				: panel.categories.length > 1 && panel.type === 'MESSAGE'
					? 'BUTTON'
					: panel.type;
	});
</script>

<h1 class="m-4 text-center text-4xl font-bold">Panels</h1>
<div class="m-2 mx-auto max-w-4xl sm:p-4">
	{#if error}
		<ErrorBox {error} />
	{/if}

	<!-- Panel List -->
	{#if panels.length > 0 && !showForm}
		<div class="mb-6 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-2xl font-bold">Saved Panels</h2>
				<button
					onclick={() => { resetForm(); showForm = true; }}
					class="rounded-lg bg-green-300 p-2 px-4 font-medium transition duration-300 hover:bg-green-500 hover:text-white dark:bg-green-500/50 dark:hover:bg-green-500"
				>
					<i class="fa-solid fa-plus"></i> New Panel
				</button>
			</div>
			<div class="space-y-4">
				{#each panels as p}
					<div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-600 dark:bg-slate-800">
						<div class="flex flex-wrap items-start justify-between gap-4">
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<span class="rounded bg-blurple px-2 py-1 text-xs font-mono text-white">#{p.id}</span>
									<h3 class="text-lg font-semibold">{p.name}</h3>
									<span class="rounded bg-gray-200 px-2 py-1 text-xs dark:bg-slate-600">{p.type}</span>
								</div>
								{#if p.title}
									<p class="mt-1 text-gray-600 dark:text-slate-400">{p.title}</p>
								{/if}
								<div class="mt-2 flex flex-wrap gap-1">
									{#each (typeof p.categories === 'string' ? JSON.parse(p.categories) : p.categories) as catId}
										<span class="rounded bg-gray-200 px-2 py-1 text-xs dark:bg-slate-600">
											{getCategoryName(catId)}
										</span>
									{/each}
								</div>
								{#if p.messages && p.messages.length > 0}
									<p class="mt-2 text-sm text-gray-500 dark:text-slate-400">
										<i class="fa-solid fa-message"></i> {p.messages.length} message(s) sent
									</p>
								{/if}
							</div>
							<div class="flex flex-wrap gap-2">
								<div class="flex items-center gap-2">
									<select class="input form-select text-sm" id="send-channel-{p.id}">
										{#each channels as channel}
											<option value={channel.id}>{channel.name}</option>
										{/each}
									</select>
									<button
										onclick={() => {
											const select = document.getElementById(`send-channel-${p.id}`);
											sendPanel(p.id, select.value);
										}}
										disabled={sendingPanelId === p.id}
										class="rounded-lg bg-blurple p-2 px-3 text-sm font-medium text-white transition duration-300 hover:bg-blurple/80 disabled:cursor-not-allowed disabled:opacity-50"
									>
										{#if sendingPanelId === p.id}
											<i class="fa-solid fa-spinner animate-spin"></i>
										{:else}
											<i class="fa-solid fa-paper-plane"></i>
										{/if}
										Send
									</button>
								</div>
								<button
									onclick={() => startEdit(p)}
									class="rounded-lg bg-yellow-300 p-2 px-3 text-sm font-medium transition duration-300 hover:bg-yellow-500 hover:text-white dark:bg-yellow-500/50 dark:hover:bg-yellow-500"
								>
									<i class="fa-solid fa-edit"></i> Edit
								</button>
								<button
									onclick={() => deletePanel(p.id)}
									class="rounded-lg bg-red-300 p-2 px-3 text-sm font-medium transition duration-300 hover:bg-red-500 hover:text-white dark:bg-red-500/50 dark:hover:bg-red-500"
								>
									<i class="fa-solid fa-trash"></i>
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Create/Edit Form -->
	{#if showForm || panels.length === 0}
		<div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-2xl font-bold">{editingPanel ? 'Edit Panel' : 'Create a Panel'}</h2>
				{#if panels.length > 0}
					<button
						onclick={resetForm}
						class="rounded-lg bg-gray-300 p-2 px-4 font-medium transition duration-300 hover:bg-gray-400 dark:bg-slate-600 dark:hover:bg-slate-500"
					>
						<i class="fa-solid fa-times"></i> Cancel
					</button>
				{/if}
			</div>
			<form onsubmit={preventDefault(() => submit())} class="my-4 text-lg">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<label>
							<span class="font-medium">Panel Name</span>
							<Required />
							<i
								class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
								title="A unique identifier for this panel"
							></i>
							<input type="text" class="input form-input" required bind:value={panel.name} placeholder="e.g. support-panel" />
						</label>
					</div>
					<div>
						<label>
							<span class="font-medium">Type</span>
							<i
								class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
								title="How will members use the panel?"
							></i>
							<select class="input form-multiselect font-normal" required bind:value={panel.type}>
								<option value="BUTTON" class="p-1" disabled={panel.categories.length > 5}>
									Buttons
								</option>
								<option value="MENU" class="p-1">
									Select menu (dropdown)
								</option>
							</select>
						</label>
					</div>
					<div>
						<label class="font-medium">
							<span class="font-medium">Categories</span>
							<Required />
							<i
								class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
								title="The category options to be available"
							></i>
							<MultiSelect
								bind:selected={selectedCategories}
								outerDivClass="text-base my-1 p-2 rounded-md border-transparent bg-gray-100 dark:bg-slate-800 font-normal shadow-sm transition-colors has-[:focus]:ring-2 has-[:focus]:ring-blurple"
								inputClass="p-0 rounded-md bg-transparent transition-colors border-0 focus:ring-0"
								ulSelectedClass="bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300"
								liSelectedClass="bg-blurple text-white text-sm font-semibold font-mono"
								ulOptionsClass="bg-white dark:bg-slate-900 p-2 max-h-48 overflow-y-auto"
								liOptionClass="rounded-md"
								liActiveOptionClass="bg-blurple text-white"
								liUserMsgClass="text-red-700 dark:text-red-500 bg-red-400/40 dark:bg-red-500/20"
								liActiveUserMsgClass=""
								maxSelectMsgClass="text-xs"
								noMatchingOptionsMsg="Create a category in the categories section"
								required={true}
								maxSelect={panel.type === 'MENU' ? 25 : 5}
								options={Object.keys(categoryOptions)}
							/>
						</label>
					</div>
					<div>
						<label>
							<span class="font-medium">Title</span>
							<i
								class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
								title="The embed title"
							></i>
							<input type="text" class="input form-input" bind:value={panel.title} />
						</label>
					</div>
					<div>
						<label>
							<span class="font-medium">Large image</span>
							<i
								class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
								title="Optional - the embed image"
							></i>
							<input type="url" class="input form-input" bind:value={panel.image} />
						</label>
					</div>
					<div>
						<label>
							<span class="font-medium">Small image (thumbnail)</span>
							<i
								class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
								title="Optional - the embed thumbnail"
							></i>
							<input type="url" class="input form-input" bind:value={panel.thumbnail} />
						</label>
					</div>
					<div class="md:col-span-2">
						<label class="font-medium">
							<span class="font-medium">Description</span>
							<i
								class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
								title="Optional - the embed description"
							></i>
							<textarea class="input form-input h-24 w-full" maxlength="4096" bind:value={panel.description}
							></textarea>
						</label>
					</div>
					<div class="place-self-center md:col-span-2">
						<button
							type="submit"
							disabled={loading}
							class="mt-4 rounded-lg bg-green-300 p-2 px-5 font-medium transition duration-300 hover:bg-green-500 hover:text-white disabled:cursor-not-allowed dark:bg-green-500/50 dark:hover:bg-green-500 dark:hover:text-white"
						>
							{#if loading}
								<i class="fa-solid fa-spinner animate-spin"></i>
							{/if}
							{editingPanel ? 'Save Changes' : 'Create Panel'}
						</button>
					</div>
				</div>
			</form>
		</div>
	{/if}

	<div class="mx-auto mt-8 max-w-lg text-center text-base">
		<div class="rounded-xl border-2 border-cyan-500 bg-cyan-500/20 p-2">
			<i class="fa-solid fa-circle-info text-2xl text-cyan-500"></i>
			<br />
			Panels are saved in the database. You can send them to multiple channels and edit them later.
			When you edit a panel, all sent messages will be automatically updated.
		</div>
	</div>
</div>
