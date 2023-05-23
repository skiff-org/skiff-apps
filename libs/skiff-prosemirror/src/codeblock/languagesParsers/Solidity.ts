import { StringStream } from '@codemirror/stream-parser';

// Formatting logic - https://github.com/alincode/codemirror-solidity

const indentUnit = 1;
const keywords = {
  pragma: true,
  solidity: true,
  import: true,
  as: true,
  from: true,
  contract: true,
  constructor: true,
  is: true,
  function: true,
  modifier: true,
  // modifiers
  pure: true,
  view: true,
  payable: true,
  constant: true,
  anonymous: true,
  indexed: true,
  returns: true,
  return: true,
  event: true,
  struct: true,
  mapping: true,
  interface: true,
  using: true,
  library: true,
  storage: true,
  memory: true,
  calldata: true,
  public: true,
  private: true,
  external: true,
  internal: true,
  emit: true,
  assembly: true,
  abstract: true,
  after: true,
  catch: true,
  final: true,
  in: true,
  inline: true,
  let: true,
  match: true,
  null: true,
  of: true,
  relocatable: true,
  static: true,
  try: true,
  typeof: true,
  var: true
};

const keywordsSpecial = {
  pragma: true,
  returns: true,
  address: true,
  contract: true,
  function: true,
  struct: true
};

const keywordsEtherUnit = {
  wei: true,
  szabo: true,
  finney: true,
  ether: true
};
const keywordsTimeUnit = {
  seconds: true,
  minutes: true,
  hours: true,
  days: true,
  weeks: true
};
const keywordsBlockAndTransactionProperties = {
  ['block']: ['coinbase', 'difficulty', 'gaslimit', 'number', 'timestamp'],
  ['msg']: ['data', 'sender', 'sig', 'value'],
  ['tx']: ['gasprice', 'origin']
};
const keywordsMoreBlockAndTransactionProperties = {
  now: true,
  gasleft: true,
  blockhash: true
};
const keywordsErrorHandling = {
  assert: true,
  require: true,
  revert: true,
  throw: true
};
const keywordsMathematicalAndCryptographicFunctions = {
  addmod: true,
  mulmod: true,
  keccak256: true,
  sha256: true,
  ripemd160: true,
  ecrecover: true
};
const keywordsContractRelated = {
  this: true,
  selfdestruct: true,
  super: true
};
const keywordsTypeInformation = { type: true };
const keywordsContractList = {};

const keywordsControlStructures = {
  if: true,
  else: true,
  while: true,
  do: true,
  for: true,
  break: true,
  continue: true,
  switch: true,
  case: true,
  default: true
};

const keywordsValueTypes = {
  bool: true,
  byte: true,
  string: true,
  enum: true,
  address: true
};

const keywordsV0505NewReserve = {
  alias: true,
  apply: true,
  auto: true,
  copyof: true,
  define: true,
  immutable: true,
  implements: true,
  macro: true,
  mutable: true,
  override: true,
  partial: true,
  promise: true,
  reference: true,
  sealed: true,
  sizeof: true,
  supports: true,
  typedef: true,
  unchecked: true
};

const keywordsAbiEncodeDecodeFunctions = {
  ['abi']: ['decode', 'encodePacked', 'encodeWithSelector', 'encodeWithSignature', 'encode']
};

const keywordsMembersOfAddressType = ['transfer', 'send', 'balance', 'call', 'delegatecall', 'staticcall'];

const natSpecTags = ['title', 'author', 'notice', 'dev', 'param', 'return'];

const atoms = {
  delete: true,
  new: true,
  true: true,
  false: true
};

const isOperatorChar = /[+\-*&^%:=<>!|\/~]/;
const isNegativeChar = /[-]/;

let curPunc;

function isVersion(stream: string | StringStream, state: { lastToken: string | null; startOfLine: any }) {
  if (state.lastToken == 'pragma solidity') {
    state.lastToken = null;
    return (
      !state.startOfLine &&
      (stream.match(/[\^{0}][0-9\.]+/) || stream.match(/[\>\=]+?[\s]*[0-9\.]+[\s]*[\<]?[\s]*[0-9\.]+/))
    );
  }
}

function isNumber(ch: string, stream: string | StringStream) {
  if (/[\d\.]/.test(ch)) {
    if (ch == '.') {
      stream.match(/^[0-9]+([eE][\-+]?[0-9]+)?/);
    } else if (ch == '0') {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      stream.match(/^[xX][0-9a-fA-F]+/) || stream.match(/^0[0-7]+/);
    } else {
      stream.match(/^[0-9]*\.?[0-9]*([eE][\-+]?[0-9]+)?/);
    }
    return true;
  }
}

function isValidInteger(token: string) {
  if (token.match(/^[u]?int/)) {
    const start = token.indexOf('t') + 1;
    if (start == token.length) return true;
    const numberPart = Number(token.substring(start, token.length));
    return numberPart % 8 === 0 && numberPart <= 256;
  }
}

function isValidFixed(token: string) {
  if (token.match(/^[u]?fixed([0-9]+x[0-9]+)?/)) {
    const start = token.indexOf('d') + 1;
    if (start == token.length) return true;
    const numberPart = token.substring(start, token.length).split('x');
    return Number(numberPart[0]) % 8 === 0 && Number(numberPart[0]) <= 256 && Number(numberPart[1]) <= 80;
  }
}

function isValidBytes(token: string) {
  if (token.match(/^bytes/)) {
    const start = token.indexOf('s') + 1;
    if (start == token.length) return true;
    const bytesPart = Number(token.substring(start, token.length));
    return bytesPart <= 32;
  }
}

function updateGarmmer(ch: string, state: { para: string | null; grammar: string; lastToken: string | null }) {
  if (ch == ',' && state.para == 'functionName(variable') {
    state.para = 'functionName(';
  }
  if (state.para != null && state.para.startsWith('functionName')) {
    if (ch == ')') {
      if (state.para.endsWith('(')) {
        state.para = state.para.substr(0, state.para.length - 1);
        if (state.para == 'functionName') state.grammar = '';
      }
    } else if (ch == '(') {
      state.para += ch;
    }
  }

  if (ch == '(' && state.lastToken == 'functionName') {
    state.lastToken += ch;
  } else if (ch == ')' && state.lastToken == 'functionName(') {
    state.lastToken = null;
  } else if (ch == '(' && state.lastToken == 'returns') {
    state.lastToken += ch;
  } else if (ch == ')' && (state.lastToken == 'returns(' || state.lastToken == 'returns(variable')) {
    state.lastToken = null;
  }
  if (ch == '(' && state.lastToken == 'address') {
    state.lastToken += ch;
  }
  curPunc = ch;
  return null;
}

function getContext(indented: number, column: number, type: string | undefined, align: string | null, prev: boolean) {
  return {
    indented,
    column,
    type,
    align,
    prev
  };
}
function pushContext(state: { context: any; indented: any }, col: any, type: string) {
  return (state.context = getContext(state.indented, col, type, null, state.context));
}
function popContext(state: { context: { prev: any; type: any; indented: any }; indented: any }) {
  if (!state.context.prev) return;
  const t = state.context.type;
  if (t == ')' || t == ']' || t == '}') state.indented = state.context.indented;
  return (state.context = state.context.prev);
}

function tokenString(quote: string) {
  return function (stream: { next: () => any }, state: { tokenize: (stream: StringStream, state: any) => any }) {
    let escaped = false,
      next,
      end = false;
    while ((next = stream.next()) != null) {
      if (next == quote && !escaped) {
        end = true;
        break;
      }
      escaped = !escaped && quote != '`' && next == '\\';
    }
    if (end || !(escaped || quote == '`')) state.tokenize = tokenBase;
    return 'string';
  };
}

function tokenComment(stream: StringStream, state: { tokenize: (stream: StringStream, state: any) => any }) {
  let maybeEnd = false,
    ch;
  while ((ch = stream.next())) {
    if (ch == '/' && maybeEnd) {
      state.tokenize = tokenBase;
      break;
    }
    maybeEnd = ch == '*';
  }
  return 'comment';
}

function updateHexLiterals(token: string, stream: StringStream) {
  if (token.match(/^hex/) && stream.peek() == '"') {
    let maybeEnd = false,
      ch,
      hexValue = '',
      stringAfterHex = '';
    while ((ch = stream.next())) {
      stringAfterHex += ch;
      if (ch == '"' && maybeEnd) {
        hexValue = stringAfterHex.substring(1, stringAfterHex.length - 1);
        if (hexValue.match(/^[0-9a-fA-F]+$/)) {
          return 'number';
        } else {
          stream.backUp(stringAfterHex.length);
        }
        break;
      }
      maybeEnd = maybeEnd || ch == '"';
    }
  }
}

function tokenBase(stream: StringStream, state: any) {
  let ch = stream.next();

  if (ch == '"' || ch == "'" || ch == '`') {
    state.tokenize = tokenString(ch);
    return state.tokenize(stream, state);
  }

  if (isVersion(stream, state)) return 'version';

  if (
    ch == '.' &&
    keywordsMembersOfAddressType.some(function (item) {
      return stream.match(`${item}`);
    })
  )
    return 'addressFunction';

  if (isNumber(ch || '', stream)) return 'number';

  if (/[\[\]{}\(\),;\:\.]/.test(ch || '')) {
    return updateGarmmer(ch || '', state);
  }

  if (ch == '/') {
    if (stream.eat('*')) {
      state.tokenize = tokenComment;
      return tokenComment(stream, state);
    }
    if (stream.match(/\/{2}/)) {
      while ((ch = stream.next())) {
        if (ch == '@') {
          stream.backUp(1);
          state.grammar = 'doc';
          break;
        }
      }
      return 'doc';
    }

    if (stream.eat('/')) {
      stream.skipToEnd();
      return 'comment';
    }
  }

  if (isNegativeChar.test(ch || '')) {
    if (isNumber(stream.peek() || '', stream)) return 'number';
    return 'operator';
  }

  if (isOperatorChar.test(ch || '')) {
    stream.eatWhile(isOperatorChar);
    return 'operator';
  }
  stream.eatWhile(/[\w\$_\xa1-\uffff]/);

  const cur = stream.current();

  if (state.grammar == 'doc') {
    if (
      natSpecTags.some(function (item) {
        return cur == `@${item}`;
      })
    )
      return 'docReserve';
    return 'doc';
  }

  if (cur === 'solidity' && state.lastToken == 'pragma') {
    state.lastToken = state.lastToken + ' ' + cur;
  }

  if (keywords.propertyIsEnumerable(cur)) {
    if (cur == 'case' || cur == 'default') curPunc = 'case';
    if (keywordsSpecial.propertyIsEnumerable(cur)) state.lastToken = cur;
    //if (cur == 'function' && state.para == 'parameterMode')
    return 'keyword';
  }

  if (keywordsEtherUnit.propertyIsEnumerable(cur)) return 'etherUnit';
  if (keywordsContractRelated.propertyIsEnumerable(cur)) return 'contractRelated';
  if (
    keywordsControlStructures.propertyIsEnumerable(cur) ||
    keywordsTypeInformation.propertyIsEnumerable(cur) ||
    keywordsV0505NewReserve.propertyIsEnumerable(cur)
  )
    return 'keyword';
  if (
    keywordsValueTypes.propertyIsEnumerable(cur) ||
    keywordsTimeUnit.propertyIsEnumerable(cur) ||
    isValidInteger(cur) ||
    isValidBytes(cur) ||
    isValidFixed(cur)
  ) {
    state.lastToken = state.lastToken + 'variable';
    return 'keyword';
  }

  if (atoms.propertyIsEnumerable(cur)) return 'atom';
  if (keywordsErrorHandling.propertyIsEnumerable(cur)) return 'errorHandling';
  if (keywordsMathematicalAndCryptographicFunctions.propertyIsEnumerable(cur)) return 'mathematicalAndCryptographic';

  if (
    keywordsMoreBlockAndTransactionProperties.propertyIsEnumerable(cur) ||
    (keywordsBlockAndTransactionProperties.hasOwnProperty(cur) &&
      keywordsBlockAndTransactionProperties[cur].some(function (item: string) {
        return stream.match(`.${item}`);
      }))
  )
    return 'variable-2';

  if (
    keywordsAbiEncodeDecodeFunctions.hasOwnProperty(cur) &&
    keywordsAbiEncodeDecodeFunctions[cur].some(function (item: string) {
      return stream.match(`.${item}`);
    })
  )
    return 'abi';

  const style = updateHexLiterals(cur, stream);
  if (style != null) return style;

  if (
    (state.lastToken == 'functionName(' || state.lastToken == 'returns(') &&
    keywordsContractList.propertyIsEnumerable(cur)
  ) {
    state.lastToken += 'variable';
    return 'variable';
  }
  if (state.lastToken == 'function') {
    state.lastToken = 'functionName';
    if (state.para == null) {
      state.grammar = 'function';
      state.para = '';
    }
    //state.parasMode = isNaN(state.parasMode) ? 1 : state.functionLayerCount++;
    state.para += 'functionName';
    return 'functionName';
  }

  if (state.lastToken == 'functionName(variable') {
    state.lastToken = 'functionName(';
    return 'parameterValue';
  }

  if (state.lastToken == 'returns(variable') {
    state.lastToken = 'returns(';
    return 'parameterValue';
  }

  if (state.lastToken == 'address' && cur == 'payable') {
    state.lastToken = 'address payable';
  }
  if (state.lastToken == 'contract' || state.lastToken == 'struct') {
    keywordsContractList[cur] = true;
    state.lastToken = null;
  }
  if (state.grammar == 'function') {
    return 'parameterValue';
  }

  return 'variable';
}

// Interface
export const solidity = {
  startState: function (currentIndent: any) {
    return {
      tokenize: null,
      context: getContext((currentIndent || 0) - indentUnit, 0, undefined, 'top', false),
      indented: 0,
      startOfLine: true
    };
  },

  token: function (
    stream: StringStream,
    state: { context: any; indented: any; startOfLine?: any; grammar?: any; tokenize?: any }
  ) {
    const ctx = state.context;
    if (stream.sol()) {
      if (ctx.align == null) ctx.align = false;
      state.indented = stream.indentation();
      state.startOfLine = true;
      if (ctx.type == 'case') ctx.type = '}';
      if (state.grammar == 'doc') state.grammar = null;
    }
    if (stream.eatSpace()) return null;
    curPunc = null;
    const style = (state.tokenize || tokenBase)(stream, state);

    if (style == 'comment') return style;
    if (ctx.align == null) ctx.align = true;

    if (curPunc == '{') pushContext(state, stream.column(), '}');
    else if (curPunc == '[') pushContext(state, stream.column(), ']');
    else if (curPunc == '(') pushContext(state, stream.column(), ')');
    else if (curPunc == 'case') ctx.type = 'case';
    else if (curPunc == '}' && ctx.type == '}') popContext(state);
    else if (curPunc == ctx.type) popContext(state);
    state.startOfLine = false;
    return style;
  },

  indent: function (state: any, textAfter: string) {
    if (state.tokenize != tokenBase && state.tokenize != null) return null;
    const ctx: { indented: number; column: number; type: string; align: boolean | null; prev: boolean } = state.context,
      firstChar = textAfter && textAfter.charAt(0);
    if (ctx.type == 'case' && /^(?:case|default)\b/.test(textAfter)) {
      state.context.type = '}';
      return ctx.indented;
    }
    const closing = firstChar == ctx.type;
    if (ctx.align) return ctx.column + (closing ? 0 : 1);
    else return ctx.indented + (closing ? 0 : indentUnit);
  },

  languageData: {
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
    closeBrackets: { brackets: ['(', '[', '{', "'", '"', '`'] }
  }
};
