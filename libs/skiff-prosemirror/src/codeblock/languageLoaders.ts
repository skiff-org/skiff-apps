// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { StreamLanguage } from '@codemirror/stream-parser';

import { CodeBlockLanguages, LegacyLanguages } from './languages';
import { solidity } from './languagesParsers/Solidity';
import { LanguageLoaders } from './types';

const languageLoaders: LanguageLoaders = {
  [CodeBlockLanguages.cpp]: () => import('@codemirror/lang-cpp').then((i) => i.cpp()),
  [CodeBlockLanguages.css]: () => import('@codemirror/lang-css').then((i) => i.css()),
  [CodeBlockLanguages.html]: () => import('@codemirror/lang-html').then((i) => i.html()),
  [CodeBlockLanguages.php]: () => import('@codemirror/lang-php').then((i) => i.php()),
  [CodeBlockLanguages.sql]: () => import('@codemirror/lang-sql').then((i) => i.sql()),
  [CodeBlockLanguages.xml]: () => import('@codemirror/lang-xml').then((i) => i.xml()),
  [CodeBlockLanguages.javascript]: () => import('@codemirror/lang-javascript').then((i) => i.javascript()),
  [CodeBlockLanguages.java]: () => import('@codemirror/lang-java').then((i) => i.java()),
  [CodeBlockLanguages.json]: () => import('@codemirror/lang-json').then((i) => i.json()),
  [CodeBlockLanguages.lezer]: () => import('@codemirror/lang-lezer').then((i) => i.lezer()),
  [CodeBlockLanguages.markdown]: () => import('@codemirror/lang-markdown').then((i) => i.markdown()),
  [CodeBlockLanguages.python]: () => import('@codemirror/lang-python').then((i) => i.python()),
  [CodeBlockLanguages.rust]: () => import('@codemirror/lang-rust').then((i) => i.rust()),
  [CodeBlockLanguages.wast]: () => import('@codemirror/lang-wast').then((i) => i.wast()),
  [CodeBlockLanguages.jsx]: () => import('@codemirror/lang-javascript').then((i) => i.jsxLanguage),
  [CodeBlockLanguages.tsx]: () => import('@codemirror/lang-javascript').then((i) => i.tsxLanguage),
  [CodeBlockLanguages.typescript]: () => import('@codemirror/lang-javascript').then((i) => i.typescriptLanguage)
};

export const legacyLanguageLoaders: LanguageLoaders = {
  [LegacyLanguages.apl]: () =>
    import('@codemirror/legacy-modes/mode/apl').then(({ apl }) => StreamLanguage.define(apl)),
  [LegacyLanguages.asciiarmor]: () =>
    import('@codemirror/legacy-modes/mode/asciiarmor').then(({ asciiArmor }) => StreamLanguage.define(asciiArmor)),
  [LegacyLanguages.asn1]: () =>
    import('@codemirror/legacy-modes/mode/asn1').then(({ asn1 }) => StreamLanguage.define(asn1)),
  [LegacyLanguages.asterisk]: () =>
    import('@codemirror/legacy-modes/mode/asterisk').then(({ asterisk }) => StreamLanguage.define(asterisk)),
  [LegacyLanguages.brainfuck]: () =>
    import('@codemirror/legacy-modes/mode/brainfuck').then(({ brainfuck }) => StreamLanguage.define(brainfuck)),
  [LegacyLanguages.clike]: () =>
    import('@codemirror/legacy-modes/mode/clike').then(({ clike }) => StreamLanguage.define(clike)),
  [LegacyLanguages.csharp]: () =>
    import('@codemirror/legacy-modes/mode/clike').then(({ csharp }) => StreamLanguage.define(csharp)),
  [LegacyLanguages.kotlin]: () =>
    import('@codemirror/legacy-modes/mode/clike').then(({ kotlin }) => StreamLanguage.define(kotlin)),
  [LegacyLanguages.objectiveC]: () =>
    import('@codemirror/legacy-modes/mode/clike').then(({ objectiveC }) => StreamLanguage.define(objectiveC)),
  [LegacyLanguages.clojure]: () =>
    import('@codemirror/legacy-modes/mode/clojure').then(({ clojure }) => StreamLanguage.define(clojure)),
  [LegacyLanguages.cmake]: () =>
    import('@codemirror/legacy-modes/mode/cmake').then(({ cmake }) => StreamLanguage.define(cmake)),
  [LegacyLanguages.cobol]: () =>
    import('@codemirror/legacy-modes/mode/cobol').then(({ cobol }) => StreamLanguage.define(cobol)),
  [LegacyLanguages.coffeescript]: () =>
    import('@codemirror/legacy-modes/mode/coffeescript').then(({ coffeeScript }) =>
      StreamLanguage.define(coffeeScript)
    ),
  [LegacyLanguages.commonlisp]: () =>
    import('@codemirror/legacy-modes/mode/commonlisp').then(({ commonLisp }) => StreamLanguage.define(commonLisp)),
  [LegacyLanguages.crystal]: () =>
    import('@codemirror/legacy-modes/mode/crystal').then(({ crystal }) => StreamLanguage.define(crystal)),
  [LegacyLanguages.cypher]: () =>
    import('@codemirror/legacy-modes/mode/cypher').then(({ cypher }) => StreamLanguage.define(cypher)),
  [LegacyLanguages.d]: () => import('@codemirror/legacy-modes/mode/d').then(({ d }) => StreamLanguage.define(d)),
  [LegacyLanguages.diff]: () =>
    import('@codemirror/legacy-modes/mode/diff').then(({ diff }) => StreamLanguage.define(diff)),
  [LegacyLanguages.dockerfile]: () =>
    import('@codemirror/legacy-modes/mode/dockerfile').then(({ dockerFile }) => StreamLanguage.define(dockerFile)),
  [LegacyLanguages.dtd]: () =>
    import('@codemirror/legacy-modes/mode/dtd').then(({ dtd }) => StreamLanguage.define(dtd)),
  [LegacyLanguages.dylan]: () =>
    import('@codemirror/legacy-modes/mode/dylan').then(({ dylan }) => StreamLanguage.define(dylan)),
  [LegacyLanguages.ebnf]: () =>
    import('@codemirror/legacy-modes/mode/ebnf').then(({ ebnf }) => StreamLanguage.define(ebnf)),
  [LegacyLanguages.ecl]: () =>
    import('@codemirror/legacy-modes/mode/ecl').then(({ ecl }) => StreamLanguage.define(ecl)),
  [LegacyLanguages.eiffel]: () =>
    import('@codemirror/legacy-modes/mode/eiffel').then(({ eiffel }) => StreamLanguage.define(eiffel)),
  [LegacyLanguages.elm]: () =>
    import('@codemirror/legacy-modes/mode/elm').then(({ elm }) => StreamLanguage.define(elm)),
  [LegacyLanguages.erlang]: () =>
    import('@codemirror/legacy-modes/mode/erlang').then(({ erlang }) => StreamLanguage.define(erlang)),
  [LegacyLanguages.factor]: () =>
    import('@codemirror/legacy-modes/mode/factor').then(({ factor }) => StreamLanguage.define(factor)),
  [LegacyLanguages.fcl]: () =>
    import('@codemirror/legacy-modes/mode/fcl').then(({ fcl }) => StreamLanguage.define(fcl)),
  [LegacyLanguages.forth]: () =>
    import('@codemirror/legacy-modes/mode/forth').then(({ forth }) => StreamLanguage.define(forth)),
  [LegacyLanguages.fortran]: () =>
    import('@codemirror/legacy-modes/mode/fortran').then(({ fortran }) => StreamLanguage.define(fortran)),
  [LegacyLanguages.gas]: () =>
    import('@codemirror/legacy-modes/mode/gas').then(({ gas }) => StreamLanguage.define(gas)),
  [LegacyLanguages.gherkin]: () =>
    import('@codemirror/legacy-modes/mode/gherkin').then(({ gherkin }) => StreamLanguage.define(gherkin)),
  [LegacyLanguages.go]: () => import('@codemirror/legacy-modes/mode/go').then(({ go }) => StreamLanguage.define(go)),
  [LegacyLanguages.groovy]: () =>
    import('@codemirror/legacy-modes/mode/groovy').then(({ groovy }) => StreamLanguage.define(groovy)),
  [LegacyLanguages.haskell]: () =>
    import('@codemirror/legacy-modes/mode/haskell').then(({ haskell }) => StreamLanguage.define(haskell)),
  [LegacyLanguages.haxe]: () =>
    import('@codemirror/legacy-modes/mode/haxe').then(({ haxe }) => StreamLanguage.define(haxe)),
  [LegacyLanguages.http]: () =>
    import('@codemirror/legacy-modes/mode/http').then(({ http }) => StreamLanguage.define(http)),
  [LegacyLanguages.idl]: () =>
    import('@codemirror/legacy-modes/mode/idl').then(({ idl }) => StreamLanguage.define(idl)),
  [LegacyLanguages.jinja2]: () =>
    import('@codemirror/legacy-modes/mode/jinja2').then(({ jinja2 }) => StreamLanguage.define(jinja2)),
  [LegacyLanguages.julia]: () =>
    import('@codemirror/legacy-modes/mode/julia').then(({ julia }) => StreamLanguage.define(julia)),
  [LegacyLanguages.livescript]: () =>
    import('@codemirror/legacy-modes/mode/livescript').then(({ liveScript }) => StreamLanguage.define(liveScript)),
  [LegacyLanguages.lua]: () =>
    import('@codemirror/legacy-modes/mode/lua').then(({ lua: legacyLua }) => StreamLanguage.define(legacyLua)),
  [LegacyLanguages.mathematica]: () =>
    import('@codemirror/legacy-modes/mode/mathematica').then(({ mathematica }) => StreamLanguage.define(mathematica)),
  [LegacyLanguages.mbox]: () =>
    import('@codemirror/legacy-modes/mode/mbox').then(({ mbox }) => StreamLanguage.define(mbox)),
  [LegacyLanguages.mirc]: () =>
    import('@codemirror/legacy-modes/mode/mirc').then(({ mirc }) => StreamLanguage.define(mirc)),
  [LegacyLanguages.mllike]: () =>
    import('@codemirror/legacy-modes/mode/mllike').then(({ oCaml }) => StreamLanguage.define(oCaml)),
  [LegacyLanguages.modelica]: () =>
    import('@codemirror/legacy-modes/mode/modelica').then(({ modelica }) => StreamLanguage.define(modelica)),
  [LegacyLanguages.mscgen]: () =>
    import('@codemirror/legacy-modes/mode/mscgen').then(({ mscgen }) => StreamLanguage.define(mscgen)),
  [LegacyLanguages.mumps]: () =>
    import('@codemirror/legacy-modes/mode/mumps').then(({ mumps }) => StreamLanguage.define(mumps)),
  [LegacyLanguages.nginx]: () =>
    import('@codemirror/legacy-modes/mode/nginx').then(({ nginx }) => StreamLanguage.define(nginx)),
  [LegacyLanguages.nsis]: () =>
    import('@codemirror/legacy-modes/mode/nsis').then(({ nsis }) => StreamLanguage.define(nsis)),
  [LegacyLanguages.ntriples]: () =>
    import('@codemirror/legacy-modes/mode/ntriples').then(({ ntriples }) => StreamLanguage.define(ntriples)),
  [LegacyLanguages.octave]: () =>
    import('@codemirror/legacy-modes/mode/octave').then(({ octave }) => StreamLanguage.define(octave)),
  [LegacyLanguages.oz]: () => import('@codemirror/legacy-modes/mode/oz').then(({ oz }) => StreamLanguage.define(oz)),
  [LegacyLanguages.pascal]: () =>
    import('@codemirror/legacy-modes/mode/pascal').then(({ pascal }) => StreamLanguage.define(pascal)),
  [LegacyLanguages.perl]: () =>
    import('@codemirror/legacy-modes/mode/perl').then(({ perl }) => StreamLanguage.define(perl)),
  [LegacyLanguages.pig]: () =>
    import('@codemirror/legacy-modes/mode/pig').then(({ pig }) => StreamLanguage.define(pig)),
  [LegacyLanguages.powershell]: () =>
    import('@codemirror/legacy-modes/mode/powershell').then(({ powerShell }) => StreamLanguage.define(powerShell)),
  [LegacyLanguages.properties]: () =>
    import('@codemirror/legacy-modes/mode/properties').then(({ properties }) => StreamLanguage.define(properties)),
  [LegacyLanguages.protobuf]: () =>
    import('@codemirror/legacy-modes/mode/protobuf').then(({ protobuf }) => StreamLanguage.define(protobuf)),
  [LegacyLanguages.puppet]: () =>
    import('@codemirror/legacy-modes/mode/puppet').then(({ puppet }) => StreamLanguage.define(puppet)),
  [LegacyLanguages.q]: () => import('@codemirror/legacy-modes/mode/q').then(({ q }) => StreamLanguage.define(q)),
  [LegacyLanguages.r]: () => import('@codemirror/legacy-modes/mode/r').then(({ r }) => StreamLanguage.define(r)),
  [LegacyLanguages.rpm]: () =>
    import('@codemirror/legacy-modes/mode/rpm').then(({ rpmSpec }) => StreamLanguage.define(rpmSpec)),
  [LegacyLanguages.ruby]: () =>
    import('@codemirror/legacy-modes/mode/ruby').then(({ ruby }) => StreamLanguage.define(ruby)),
  [LegacyLanguages.sas]: () =>
    import('@codemirror/legacy-modes/mode/sas').then(({ sas }) => StreamLanguage.define(sas)),
  [LegacyLanguages.scheme]: () =>
    import('@codemirror/legacy-modes/mode/scheme').then(({ scheme }) => StreamLanguage.define(scheme)),
  [LegacyLanguages.shell]: () =>
    import('@codemirror/legacy-modes/mode/shell').then(({ shell }) => StreamLanguage.define(shell)),
  [LegacyLanguages.smalltalk]: () =>
    import('@codemirror/legacy-modes/mode/smalltalk').then(({ smalltalk }) => StreamLanguage.define(smalltalk)),
  [LegacyLanguages.solr]: () =>
    import('@codemirror/legacy-modes/mode/solr').then(({ solr }) => StreamLanguage.define(solr)),
  [LegacyLanguages.sparql]: () =>
    import('@codemirror/legacy-modes/mode/sparql').then(({ sparql }) => StreamLanguage.define(sparql)),
  [LegacyLanguages.spreadsheet]: () =>
    import('@codemirror/legacy-modes/mode/spreadsheet').then(({ spreadsheet }) => StreamLanguage.define(spreadsheet)),
  [LegacyLanguages.stex]: () =>
    import('@codemirror/legacy-modes/mode/stex').then(({ stex }) => StreamLanguage.define(stex)),
  [LegacyLanguages.stylus]: () =>
    import('@codemirror/legacy-modes/mode/stylus').then(({ stylus }) => StreamLanguage.define(stylus)),
  [LegacyLanguages.swift]: () =>
    import('@codemirror/legacy-modes/mode/swift').then(({ swift }) => StreamLanguage.define(swift)),
  [LegacyLanguages.tcl]: () =>
    import('@codemirror/legacy-modes/mode/tcl').then(({ tcl }) => StreamLanguage.define(tcl)),
  [LegacyLanguages.textile]: () =>
    import('@codemirror/legacy-modes/mode/textile').then(({ textile }) => StreamLanguage.define(textile)),
  [LegacyLanguages.tiddlywiki]: () =>
    import('@codemirror/legacy-modes/mode/tiddlywiki').then(({ tiddlyWiki }) => StreamLanguage.define(tiddlyWiki)),
  [LegacyLanguages.tiki]: () =>
    import('@codemirror/legacy-modes/mode/tiki').then(({ tiki }) => StreamLanguage.define(tiki)),
  [LegacyLanguages.toml]: () =>
    import('@codemirror/legacy-modes/mode/toml').then(({ toml }) => StreamLanguage.define(toml)),
  [LegacyLanguages.troff]: () =>
    import('@codemirror/legacy-modes/mode/troff').then(({ troff }) => StreamLanguage.define(troff)),
  [LegacyLanguages.ttcn]: () =>
    import('@codemirror/legacy-modes/mode/ttcn').then(({ ttcn }) => StreamLanguage.define(ttcn)),
  [LegacyLanguages.turtle]: () =>
    import('@codemirror/legacy-modes/mode/turtle').then(({ turtle }) => StreamLanguage.define(turtle)),
  [LegacyLanguages.vb]: () => import('@codemirror/legacy-modes/mode/vb').then(({ vb }) => StreamLanguage.define(vb)),
  [LegacyLanguages.vbscript]: () =>
    import('@codemirror/legacy-modes/mode/vbscript').then(({ vbScript }) => StreamLanguage.define(vbScript)),
  [LegacyLanguages.velocity]: () =>
    import('@codemirror/legacy-modes/mode/velocity').then(({ velocity }) => StreamLanguage.define(velocity)),
  [LegacyLanguages.verilog]: () =>
    import('@codemirror/legacy-modes/mode/verilog').then(({ verilog }) => StreamLanguage.define(verilog)),
  [LegacyLanguages.vhdl]: () =>
    import('@codemirror/legacy-modes/mode/vhdl').then(({ vhdl }) => StreamLanguage.define(vhdl)),
  [LegacyLanguages.webidl]: () =>
    import('@codemirror/legacy-modes/mode/webidl').then(({ webIDL }) => StreamLanguage.define(webIDL)),
  [LegacyLanguages.xquery]: () =>
    import('@codemirror/legacy-modes/mode/xquery').then(({ xQuery }) => StreamLanguage.define(xQuery)),
  [LegacyLanguages.yacas]: () =>
    import('@codemirror/legacy-modes/mode/yacas').then(({ yacas }) => StreamLanguage.define(yacas)),
  [LegacyLanguages.yaml]: () =>
    import('@codemirror/legacy-modes/mode/yaml').then(({ yaml }) => StreamLanguage.define(yaml)),
  [LegacyLanguages.z80]: () =>
    import('@codemirror/legacy-modes/mode/z80').then(({ z80 }) => StreamLanguage.define(z80)),
  [LegacyLanguages.solidity]: () => StreamLanguage.define(solidity)
};

export default languageLoaders;
