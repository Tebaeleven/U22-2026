import type { ExprNode, StatementNode } from "./ast-types"
import type { ClassAST, ClassProgramAST, FieldDecl, MethodAST } from "./class-ast-types"

export const BUILTIN_METHODS = new Set([
  "move", "turnRight", "turnLeft", "goto", "setPosition", "glide", "tweenTo",
  "setX", "setY", "changeXBy", "changeYBy", "ifOnEdgeBounce", "setAngle",
  "setVelocityX", "setVelocityY", "setVelocity", "setPhysics", "setGravity",
  "setBounce", "setCollideWorldBounds", "setAllowGravity", "disableBody", "enableBody",
  "onCollide", "setAcceleration", "setDrag", "setDamping", "setMaxVelocity",
  "setAngularVelocity", "setImmovable", "setMass", "setPushable",
  "worldWrap", "moveTo", "accelerateTo", "velocityFromAngle", "physicsSpeed",
  "setAccelerationX", "setAccelerationY", "setBodySize", "setBodyOffset", "setCircle",
  "show", "hide", "say", "think", "setSize", "setCostume", "nextCostume",
  "setTint", "clearTint", "setAlpha", "setFlipX",
  "addText", "setText", "removeText", "floatingText",
  "addTextAt", "updateTextAt", "removeTextAt",
  "tweenScale", "tweenAlpha", "tweenAngle", "tweenToEase", "tweenScaleEase", "tweenAlphaEase", "tweenAngleEase",
  "emitParticles", "createClone", "deleteClone",
  "emit", "unwatch", "touching", "isKeyPressed", "isKeyJustDown", "isOnGround",
  "enableDrag", "createAnim", "playAnim", "stopAnim", "onAnimComplete",
  "playSound", "playSoundLoop", "stopSound", "setSoundVolume",
  "wait", "waitUntil", "stop", "restart",
  "setInterval", "clearInterval", "setTimeout",
  "cameraFollow", "cameraStopFollow", "cameraShake", "cameraZoom", "cameraFade",
  "setOrigin", "setScrollFactor", "setLayer",
  "addTag", "removeTag", "hasTag",
  "setState", "stateIs",
  "showVariable", "hideVariable",
  "switchScene", "setTimeScale", "setBackground",
  "getVariableOf", "setVariableOf", "changeVariableOf",
  "dictSet", "dictGet", "dictDelete", "dictHas", "dictKeys", "dictLength",
  "listInsert", "listReplace", "listContains",
  "resetTimer",
  "graphics.fillRect", "graphics.clear",
])

export const GLOBAL_FUNCTIONS = new Set([
  "join", "floor", "ceil", "round", "abs", "sqrt", "pow",
  "sin", "cos", "tan", "atan2", "sign",
  "min", "max", "lerp", "clamp", "remap",
  "random", "randomInt",
  "letterOf", "contains", "substring", "split", "replace",
  "toNumber", "toText",
  "propertyOf", "distanceTo", "angleTo",
  "save", "load",
])

export const BUILTIN_PROPERTIES = new Set([
  "x", "y", "direction", "size", "angle",
  "velocityX", "velocityY", "physicsSpeed", "mouseX", "mouseY",
  "timer", "mouseDown", "mouseWheel", "costumeNumber",
  "newValue", "oldValue", "eventData", "state",
  "currentScene", "layer", "collisionTarget", "pi", "tagLoopTarget",
])

const CROSS_SPRITE_PROPERTIES = new Set([
  "x", "y", "direction", "size", "state", "layer", "costumeNumber",
])

type ClassInfo = {
  name: string
  mutableFields: Set<string>
  immutableFields: Set<string>
  allFields: Set<string>
}

type Scope = {
  classInfo: ClassInfo
  classNames: Set<string>
  classMap: Map<string, ClassInfo>
  locals: Set<string>
}

function getClassInfo(cls: ClassAST): ClassInfo {
  const mutableFields = new Set<string>()
  const immutableFields = new Set<string>()
  const allFields = new Set<string>()

  for (const field of cls.fields ?? []) {
    if (allFields.has(field.name)) {
      throw new Error(`Duplicate field "${field.name}" in class ${cls.name}`)
    }
    allFields.add(field.name)
    if (field.mutable) {
      mutableFields.add(field.name)
    } else {
      immutableFields.add(field.name)
    }
  }

  return {
    name: cls.name,
    mutableFields,
    immutableFields,
    allFields,
  }
}

function isDeclared(scope: Scope, name: string) {
  return scope.locals.has(name) || scope.classInfo.allFields.has(name) || BUILTIN_PROPERTIES.has(name)
}

function assertDeclared(scope: Scope, name: string, message: string) {
  if (!isDeclared(scope, name)) {
    throw new Error(message)
  }
}

function assertMutable(scope: Scope, name: string, message: string) {
  if (scope.classInfo.immutableFields.has(name)) {
    throw new Error(message)
  }
  if (BUILTIN_PROPERTIES.has(name)) {
    throw new Error(message)
  }
  if (!scope.locals.has(name) && !scope.classInfo.mutableFields.has(name)) {
    throw new Error(message)
  }
}

function validateField(field: FieldDecl, scope: Scope) {
  validateExpression(field.value, scope)
}

function validateMethod(method: MethodAST, scope: Scope) {
  switch (method.kind.type) {
    case "onTouched":
      if (method.kind.target !== "any" && !scope.classNames.has(method.kind.target)) {
        throw new Error(`Unknown sprite "${method.kind.target}" in onTouched of class ${scope.classInfo.name}`)
      }
      break
    case "onVarChange":
    case "onWatch":
    case "onWatchOnce":
      if (!scope.classInfo.allFields.has(method.kind.variable) && !scope.locals.has(method.kind.variable)) {
        throw new Error(`Unknown watched variable "${method.kind.variable}" in class ${scope.classInfo.name}`)
      }
      break
    default:
      break
  }

  validateStatements(method.body, {
    ...scope,
    locals: new Set(scope.locals),
  })
}

function validateStatements(statements: StatementNode[], scope: Scope) {
  for (const statement of statements) {
    validateStatement(statement, scope)
  }
}

function validateStatement(statement: StatementNode, scope: Scope) {
  switch (statement.type) {
    case "call":
      validateCall(statement.name, statement.args, scope)
      return
    case "assign":
    case "changeBy":
      assertMutable(
        scope,
        statement.variable,
        `Assignment to undeclared or immutable variable "${statement.variable}" in class ${scope.classInfo.name}`
      )
      validateExpression(statement.value, scope)
      return
    case "crossAssign":
    case "crossChangeBy": {
      const targetInfo = scope.classMap.get(statement.sprite)
      if (!targetInfo) {
        throw new Error(`Unknown sprite "${statement.sprite}" in class ${scope.classInfo.name}`)
      }
      if (!targetInfo.mutableFields.has(statement.variable)) {
        throw new Error(`Assignment to undeclared or immutable variable "${statement.sprite}.${statement.variable}"`)
      }
      validateExpression(statement.value, scope)
      return
    }
    case "if":
      validateExpression(statement.condition, scope)
      validateStatements(statement.body, { ...scope, locals: new Set(scope.locals) })
      return
    case "ifElse":
      validateExpression(statement.condition, scope)
      validateStatements(statement.ifBody, { ...scope, locals: new Set(scope.locals) })
      validateStatements(statement.elseBody, { ...scope, locals: new Set(scope.locals) })
      return
    case "while":
      validateExpression(statement.condition, scope)
      validateStatements(statement.body, { ...scope, locals: new Set(scope.locals) })
      return
    case "repeat":
      validateExpression(statement.times, scope)
      validateStatements(statement.body, { ...scope, locals: new Set(scope.locals) })
      return
    case "forever":
    case "spawn":
    case "batch":
      validateStatements(statement.body, { ...scope, locals: new Set(scope.locals) })
      return
    case "for": {
      validateExpression(statement.from, scope)
      validateExpression(statement.to, scope)
      const loopScope = { ...scope, locals: new Set(scope.locals) }
      loopScope.locals.add(statement.variable)
      validateStatements(statement.body, loopScope)
      return
    }
    case "forEach": {
      assertDeclared(
        scope,
        statement.list,
        `Unknown list variable "${statement.list}" in class ${scope.classInfo.name}`
      )
      const loopScope = { ...scope, locals: new Set(scope.locals) }
      loopScope.locals.add(statement.variable)
      validateStatements(statement.body, loopScope)
      return
    }
    case "varDecl":
      if (scope.locals.has(statement.name) || scope.classInfo.allFields.has(statement.name) || BUILTIN_PROPERTIES.has(statement.name)) {
        throw new Error(`Duplicate local variable "${statement.name}" in class ${scope.classInfo.name}`)
      }
      validateExpression(statement.value, scope)
      scope.locals.add(statement.name)
      return
    case "liveAssign":
      validateExpression(statement.value, scope)
      if (!scope.locals.has(statement.variable) && !scope.classInfo.allFields.has(statement.variable)) {
        scope.locals.add(statement.variable)
      } else {
        assertMutable(
          scope,
          statement.variable,
          `Assignment to undeclared or immutable variable "${statement.variable}" in class ${scope.classInfo.name}`
        )
      }
      return
    case "return":
      validateExpression(statement.value, scope)
      return
    case "break":
    case "continue":
      return
  }
}

function validateExpression(expression: ExprNode, scope: Scope) {
  switch (expression.type) {
    case "number":
    case "string":
    case "boolean":
      return
    case "variable":
      assertDeclared(
        scope,
        expression.name,
        `Use of undeclared variable "${expression.name}" in class ${scope.classInfo.name}`
      )
      return
    case "call":
      validateCall(expression.name, expression.args, scope)
      return
    case "binary":
      validateExpression(expression.left, scope)
      validateExpression(expression.right, scope)
      return
    case "unary":
      validateExpression(expression.operand, scope)
      return
    case "property":
      if (expression.object === "velocity") {
        if (expression.property !== "x" && expression.property !== "y") {
          throw new Error(`Unknown property "${expression.object}.${expression.property}" in class ${scope.classInfo.name}`)
        }
        return
      }
      if (!scope.classNames.has(expression.object)) {
        throw new Error(`Unknown property target "${expression.object}" in class ${scope.classInfo.name}`)
      }
      const targetInfo = scope.classMap.get(expression.object)
      if (!targetInfo) {
        throw new Error(`Unknown sprite "${expression.object}" in class ${scope.classInfo.name}`)
      }
      if (!targetInfo.allFields.has(expression.property) && !CROSS_SPRITE_PROPERTIES.has(expression.property)) {
        throw new Error(`Unknown property "${expression.object}.${expression.property}" in class ${scope.classInfo.name}`)
      }
      return
  }
}

function validateCall(name: string, args: ExprNode[], scope: Scope) {
  if (!BUILTIN_METHODS.has(name) && !GLOBAL_FUNCTIONS.has(name)) {
    throw new Error(`Unknown method "${name}" in class ${scope.classInfo.name}`)
  }
  for (const arg of args) {
    validateExpression(arg, scope)
  }
}

export function validateClassProgram(program: ClassProgramAST) {
  const classInfos = new Map(program.map((cls) => [cls.name, getClassInfo(cls)]))
  const classNames = new Set(classInfos.keys())

  for (const cls of program) {
    const classInfo = classInfos.get(cls.name)
    if (!classInfo) continue
    const scope: Scope = {
      classInfo,
      classNames,
      classMap: classInfos,
      locals: new Set<string>(),
    }

    for (const field of cls.fields ?? []) {
      validateField(field, scope)
    }

    for (const method of cls.methods) {
      validateMethod(method, scope)
    }
  }
}
