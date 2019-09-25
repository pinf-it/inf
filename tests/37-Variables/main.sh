#!/usr/bin/env bash.origin.script

inf {
    "vars #": "./vars.",
    "vars # set greeting": "Hello World",
    "PINF $": "vars # vars",
    "# echo +1": "\${PINF.greeting}",

    "# echo +2": "---",

    "ns @": "our",
    "ns @ PINF $": "vars # vars",
    "# echo +3": "\${ns @ PINF.greeting}",

    "# echo +3a": "---",

    "# echo +3b": "Pattern: <FILE>",
    "# echo +3c": "\${__FILE__}",

    "# echo +4": "--- dynamic start 1 ---",

    "runner1 #": "./sub1/sub2/runner.",
    "runner1 # run": (inf () >>>
        {
            "# echo": "Greeting: \${PINF.greeting}",
            "# echo": "Greeting: \${ns @ PINF.greeting}",

            "#": "./sub1/sub2/dynamic-load1."
        }
    <<<),

    "# echo +4a": "--- dynamic end 1 ---",

    "ns @ router #": "./router.",
    "vars # set route": "/",
    "ns @ router # \${ns @ PINF.route}": "\${ns @ PINF.greeting}",
    "ns @ router # / + 1": "run()",

    "# echo +5": "---",

    "# echo +6": "Pattern: <FILE>",
    "# echo +7": "\${__FILE__}",

    "# echo +8": "Pattern: <FILEPATH>",
    "# echo +9": "\${__FILEPATH__}",

    "# echo +10": "Pattern: <DIRNAME>/<FILENAME>",
    "# echo +11": "\${__DIRNAME__}/\${__FILENAME__}",

    "# echo +12": "Pattern: <DIRPATH>/<BASENAME>",
    "# echo +13": "\${__DIRPATH__}/\${__BASENAME__}",

    "# echo +14": "Pattern: <DIRNAME>/<FILENAME_STEM>.<FILENAME_EXTENSION>",
    "# echo +15": "\${__DIRNAME__}/\${__FILENAME_STEM__}.\${__FILENAME_EXTENSION__}",

    "# echo +16": "Pattern: <DIRNAME>/<FILENAME_STEM><FILENAME_SUFFIX>",
    "# echo +17": "\${__DIRNAME__}/\${__FILENAME_STEM__}\${__FILENAME_SUFFIX__}",

    "# echo +18": "Pattern: <DIR_PARENT_PATH>/<DIR_BASENAME>/<FILENAME>",
    "# echo +19": "\${__DIR_PARENT_PATH__}/\${__DIR_BASENAME__}/\${__FILENAME__}",

    "# echo +20": "Pattern: <BASEDIR>/<RELPATH>",
    "# echo +21": "\${__BASEDIR__}/\${__RELPATH__}",

    "# echo +22": "---",

    "#": "./sub1/sub2/",

    "# echo +25": "---",

    "# echo +23": "After sub '__FILE__': \${__FILE__}",

    "# echo +24": "Ignored variable: \\\${__FILE__}"
}
