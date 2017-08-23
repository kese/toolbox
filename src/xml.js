import moment from 'moment'
import { parse } from 'ltx'
import { toCamelCase } from './util'

export const TYPE = Symbol('TYPE')
export const ELEMS = Symbol('ELEMS')

const parseFns = {
  date: moment,
  float: parseFloat,
  int: parseInt
}

function parseAttrs (attrs, rules = {}) {
  return Object.keys(attrs).reduce((result, attrKey) => {
    const attrVal = attrs[attrKey]
    const [parsedVal = attrVal] = Object.keys(rules)
      .filter(ruleKey => rules[ruleKey].test(attrKey))
      .map(ruleKey => parseFns[ruleKey](attrVal))
    return { [toCamelCase(attrKey)]: parsedVal, ...result }
  }, {})
}

function parseElem (rawElem, rules) {
  const type = toCamelCase(rawElem.name, true)
  const elems = rawElem.getChildElements().map(elem => parseElem(elem, rules))
  const attrs = parseAttrs(rawElem.attrs, rules[rawElem.name])
  return { [TYPE]: type, [ELEMS]: elems, ...attrs }
}

export function parseXML (xml, rules = {}) {
  return parseElem(parse(xml), rules)
}
