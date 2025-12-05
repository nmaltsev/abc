## FR1 transpile import declarations
case 1:
	import { default as VCBundle } from '/viewcompiler/viewcompiler.bundle.mjs'
	const VCBundle = require('/viewcompiler/viewcompiler.bundle.mjs')
case2: 
	import { default as VCBundle, def1, def2 as def3 } from '/viewcompiler/viewcompiler.bundle.mjs'
	cosnt VCBundle, {def1, def2:def3} = require('/viewcompiler/viewcompiler.bundle.mjs')
