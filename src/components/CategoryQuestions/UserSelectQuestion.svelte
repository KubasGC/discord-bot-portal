<script>
	import { page } from '$app/stores';
	import Required from '../Required.svelte';
	/** @type {{question: any, roles: any[]}} */
	let { question = $bindable(), roles = [] } = $props();
</script>

<div>
	<label class="font-medium">
		Label
		<Required />
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
			title="The title of the question (e.g. 'Select a user')"
		></i>
		<input
			type="text"
			class="input form-input text-sm"
			required
			maxlength="45"
			bind:value={question.label}
		/>
	</label>
</div>
<div>
	<label class="font-medium">
		Placeholder
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
			title="The placeholder text shown in the select menu"
		></i>
		<input
			type="text"
			class="input form-input text-sm"
			maxlength="100"
			bind:value={question.placeholder}
		/>
	</label>
</div>
<div>
	<label for="required-{question.id}" class="font-medium">
		Required
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
			title="Is selecting a user required?"
		></i>
		<input
			type="checkbox"
			id="required-{question.id}"
			name="required"
			class="form-checkbox"
			bind:checked={question.required}
		/>
	</label>
</div>
<div>
	<label class="font-medium">
		Allowed roles
		<Required />
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
			title="Only users with these roles will be shown in the select menu"
		></i>
		<select
			multiple
			required
			class="input form-multiselect h-44 font-normal"
			bind:value={question.allowedRoles}
		>
			{#each roles as role}
				<option value={role.id} class="m-1 rounded p-1" style={role._style}>
					{role.unicodeEmoji || ''}
					{role.name}
				</option>
			{/each}
		</select>
	</label>
</div>
