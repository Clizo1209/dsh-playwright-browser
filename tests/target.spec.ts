import { describe, expect, it } from 'vitest'
import { parseTarget } from '../src/target.ts'

describe('parseTarget', () => {
  it('supports semantic and CSS targets', () => {
    expect(parseTarget('role=button|Save')).toEqual({ kind: 'role', value: 'button', name: 'Save' })
    expect(parseTarget('textbox|Text input')).toEqual({ kind: 'role', value: 'textbox', name: 'Text input' })
    expect(parseTarget('checkbox|Default checkbox')).toEqual({ kind: 'role', value: 'checkbox', name: 'Default checkbox' })
    expect(parseTarget('text=Settings')).toEqual({ kind: 'text', value: 'Settings' })
    expect(parseTarget('css=#submit')).toEqual({ kind: 'css', value: '#submit' })
    expect(parseTarget('#legacy')).toEqual({ kind: 'css', value: '#legacy' })
  })

  it('rejects malformed targets', () => {
    expect(() => parseTarget('')).toThrow('non-empty')
    expect(() => parseTarget('xpath=//button')).toThrow('unsupported target prefix')
    expect(() => parseTarget('role=button|')).toThrow('role targets use')
  })
})
