/**
 * Zod → Dart code generator.
 *
 * Introspects the Zod schemas exported by `@patiently/shared` and emits Dart
 * data classes + enums into `mobile/lib/data/api.g.dart`, so the Flutter client's
 * model layer is generated from the same single source of truth the server uses.
 * Run with `npm run codegen`.
 *
 * Scope: handles exactly the constructs used in `schemas.ts` (objects, enums,
 * string/number/boolean, arrays, optional/nullable/default, datetime strings,
 * and named references between schemas). Human-only concerns Zod can't express
 * — e.g. friendly store/condition labels — live in hand-written Dart extensions.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import * as shared from '../src/index.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Zod = any;

const RESERVED: Record<string, string> = {
  new: 'newItem',
  default: 'defaultValue',
  in: 'inValue',
  is: 'isValue',
};

function camel(wire: string): string {
  const parts = wire.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const head = parts[0]!.toLowerCase();
  const tail = parts.slice(1).map((p) => p[0]!.toUpperCase() + p.slice(1));
  const name = [head, ...tail].join('');
  return RESERVED[name] ?? name;
}

// Build identity maps so nested references resolve to their generated names.
const enumNames = new Map<Zod, string>();
const objectNames = new Map<Zod, string>();
for (const [name, value] of Object.entries(shared)) {
  const def = (value as Zod)?._def;
  if (!def) continue;
  if (def.typeName === 'ZodEnum') enumNames.set(value, name);
  else if (def.typeName === 'ZodObject') objectNames.set(value, name);
}

interface Resolved {
  dart: string;
  nullable: boolean;
  /** Dart expression decoding a raw json value `expr` into the typed value. */
  fromJson: (expr: string) => string;
  /** Dart expression encoding a typed `expr` back to a json value. */
  toJson: (expr: string) => string;
}

function resolve(zt: Zod): Resolved {
  const def = zt._def;
  switch (def.typeName) {
    case 'ZodOptional':
    case 'ZodNullable': {
      const inner = resolve(def.innerType);
      return { ...inner, nullable: true };
    }
    case 'ZodDefault': {
      // Defaults are always present in server output → treat as required.
      return resolve(def.innerType);
    }
    case 'ZodString': {
      const isDate = (def.checks ?? []).some((c: Zod) => c.kind === 'datetime');
      if (isDate) {
        return {
          dart: 'DateTime',
          nullable: false,
          fromJson: (e) => `DateTime.parse(${e} as String)`,
          toJson: (e) => `${e}.toUtc().toIso8601String()`,
        };
      }
      return {
        dart: 'String',
        nullable: false,
        fromJson: (e) => `${e} as String`,
        toJson: (e) => e,
      };
    }
    case 'ZodNumber': {
      const isInt = (def.checks ?? []).some((c: Zod) => c.kind === 'int');
      return {
        dart: isInt ? 'int' : 'double',
        nullable: false,
        fromJson: (e) => `(${e} as num).${isInt ? 'toInt' : 'toDouble'}()`,
        toJson: (e) => e,
      };
    }
    case 'ZodBoolean':
      return { dart: 'bool', nullable: false, fromJson: (e) => `${e} as bool`, toJson: (e) => e };
    case 'ZodEnum': {
      const name = enumNames.get(zt) ?? 'String';
      return {
        dart: name,
        nullable: false,
        fromJson: (e) => `${name}.fromApi(${e} as String)`,
        toJson: (e) => `${e}.api`,
      };
    }
    case 'ZodArray': {
      const el = resolve(def.type);
      return {
        dart: `List<${el.dart}>`,
        nullable: false,
        fromJson: (e) =>
          `((${e} as List<dynamic>?) ?? const []).map((e) => ${el.fromJson('e')}).toList()`,
        toJson: (e) => `${e}.map((e) => ${el.toJson('e')}).toList()`,
      };
    }
    case 'ZodObject': {
      const name = objectNames.get(zt);
      if (!name)
        return {
          dart: 'Map<String, dynamic>',
          nullable: false,
          fromJson: (e) => `${e} as Map<String, dynamic>`,
          toJson: (e) => e,
        };
      return {
        dart: name,
        nullable: false,
        fromJson: (e) => `${name}.fromJson(${e} as Map<String, dynamic>)`,
        toJson: (e) => `${e}.toJson()`,
      };
    }
    default:
      return { dart: 'dynamic', nullable: false, fromJson: (e) => e, toJson: (e) => e };
  }
}

function genEnum(name: string, schema: Zod): string {
  const values: string[] = schema._def.values;
  const entries = values.map((v) => `  ${camel(v)}('${v}')`).join(',\n');
  return `enum ${name} {
${entries};

  const ${name}(this.api);
  final String api;

  static ${name} fromApi(String value) =>
      values.firstWhere((e) => e.api == value, orElse: () => values.first);
}`;
}

function genClass(name: string, schema: Zod): string {
  const shape: Record<string, Zod> = schema._def.shape();
  const fields = Object.entries(shape).map(([key, zt]) => {
    let r: Resolved;
    try {
      r = resolve(zt);
    } catch (err) {
      throw new Error(
        `Failed resolving ${name}.${key} (${(zt as Zod)?._def?.typeName}): ${String(err)}`,
      );
    }
    return { key, ...r, type: `${r.dart}${r.nullable ? '?' : ''}` };
  });

  const decls = fields.map((f) => `  final ${f.type} ${f.key};`).join('\n');

  const ctorParams = fields
    .map((f) => (f.nullable ? `    this.${f.key},` : `    required this.${f.key},`))
    .join('\n');

  const fromJsonFields = fields
    .map((f) => {
      const raw = `json['${f.key}']`;
      const value = f.nullable ? `${raw} == null ? null : ${f.fromJson(raw)}` : f.fromJson(raw);
      return `        ${f.key}: ${value},`;
    })
    .join('\n');

  const toJsonFields = fields
    .map((f) =>
      f.nullable
        ? `        if (${f.key} != null) '${f.key}': ${f.toJson(`${f.key}!`)},`
        : `        '${f.key}': ${f.toJson(f.key)},`,
    )
    .join('\n');

  return `class ${name} {
  ${name}({
${ctorParams}
  });

  factory ${name}.fromJson(Map<String, dynamic> json) => ${name}(
${fromJsonFields}
      );

${decls}

  Map<String, dynamic> toJson() => {
${toJsonFields}
      };
}`;
}

function main(): void {
  const enums: string[] = [];
  const classes: string[] = [];
  for (const [name, value] of Object.entries(shared)) {
    const def = (value as Zod)?._def;
    if (!def) continue;
    if (def.typeName === 'ZodEnum') enums.push(genEnum(name, value));
    else if (def.typeName === 'ZodObject') classes.push(genClass(name, value));
  }

  const out = `// GENERATED CODE — DO NOT EDIT BY HAND.
// Produced from the Zod schemas in @patiently/shared by \`npm run codegen\`.
// Money is integer minor units (paise). Friendly labels live in enums.dart.
// ignore_for_file: type=lint

${enums.join('\n\n')}

${classes.join('\n\n')}
`;

  const target = resolvePath(process.cwd(), 'mobile/lib/data/api.g.dart');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, out, 'utf8');
  console.log(`[codegen] wrote ${target} (${enums.length} enums, ${classes.length} classes).`);
}

main();
