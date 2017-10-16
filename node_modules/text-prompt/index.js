'use strict'

const ui =       require('cli-styles')
const esc =      require('ansi-escapes')
const chalk =    require('chalk')
const wrap =     require('prompt-skeleton')



const TextPrompt = {

	  setValue: function (v) {
	  	this.value = v
	  	this.rendered = this.transform(v)
	  	this.cursor = Math.min(this.rendered.length, this.cursor)
	  	this.emit()
	}

	, reset: function () {
		this.setValue(this.initialValue)
		this.render()
	}

	, abort: function () {
		this.done = this.aborted = true
		this.emit()
		this.render()
		this.out.write('\n')
		this.close()
	}

	, submit: function () {
		this.done = true
		this.aborted = false
		this.emit()
		this.render()
		this.out.write('\n')
		this.close()
	}



	, _: function (c) {
		this.setValue(this.value + c)
		this.cursor = this.rendered.length
		this.render()
	}
	, delete: function () {
		if (this.value.length === 0) return this.bell()
		this.setValue(this.value.slice(0, -1))
		this.render()
	}



	, first: function () {
		this.cursor = 0
		this.render()
	}
	, last: function () {
		this.cursor = this.rendered.length
		this.render()
	}

	, left: function () {
		if (this.cursor <= 0) return this.bell()
		this.cursor--
		this.render()
	}
	, right: function () {
		if (this.cursor >= this.rendered.length) return this.bell()
		this.cursor++
		this.render()
	}



	, render: function () {
		const prompt = [
			  ui.symbol(this.done, this.aborted)
			, chalk.bold(this.msg)
			, ui.delimiter(this.done)
			, this.rendered
		].join(' ')

		this.out.write(this.clear + prompt)
		this.out.write(esc.cursorMove(-this.rendered.length + this.cursor))

		this.clear = ui.clear(prompt)
	}
}



const defaults = {
	  value:     ''
	, rendered:  ''
	, transform: ui.render()

	, clear:     ui.clear('')
	, msg:       ''
	, cursor:    0

	, done:      false
	, aborted:   false
}

const textPrompt = (msg, opt) => {
	if ('string' !== typeof msg) throw new Error('Message must be string.')
	if (Array.isArray(opt) || 'object' !== typeof opt) opt = {}

	let p = Object.assign(Object.create(TextPrompt), defaults, opt)
	p.msg          = msg
	p.initialValue = p.value
	p.rendered = p.transform(p.value)
	if (!('cursor' in opt)) p.cursor = p.rendered.length

	return wrap(p)
}



module.exports = Object.assign(textPrompt, {TextPrompt})
