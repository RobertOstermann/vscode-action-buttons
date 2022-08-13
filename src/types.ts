export interface CommandOpts {
	cwd?: string
	saveAll?: boolean
	command: string
	singleInstance?: boolean
	id: string
	name: string
	createButton: boolean
	tooltip: string
	color: string
	focus?: boolean
	useVsCodeApi?: boolean
	args?: string[]
}

export interface ButtonOpts {
	command: string
	tooltip: string
	name: string
	color: string
}

export interface DropdownOpts {
	id: string
	name: string
	commands: (number|string)[]
	color: string
	ignoreFocusOut: boolean
	tooltip: string
}