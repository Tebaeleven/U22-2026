// Game: 算数チャレンジ (inspired by Zenbaki)
// ランダム生成の算数問題に4択で回答、制限時間＆レベルアップ

import { sp, snd, type SampleProject } from "../_helpers"

const A = "/assets/samples/zenbaki"

export const mathChallengeGame: SampleProject = {
  id: "math-challenge",
  name: "算数チャレンジ",
  description: "制限時間内に算数の問題を解く4択クイズ",
  category: "games",
  sprites: [
    { ...sp("s-manager", "問題管理", "🧮",
      { w: 4, h: 4, color: "#000000" },
      { x: 0, y: 0 },
      { visible: false }),
      sounds: [snd("correct", `${A}/sounds/win.mp3`), snd("wrong", `${A}/sounds/fail.mp3`), snd("drip", `${A}/sounds/drip.mp3`)],
    },
    sp("s-choice-a", "選択肢A", "🅰️",
      { w: 200, h: 100, color: "#4488ff", radius: 12, border: "#2266cc" },
      { x: -300, y: -100 }),
    sp("s-choice-b", "選択肢B", "🅱️",
      { w: 200, h: 100, color: "#44cc88", radius: 12, border: "#229966" },
      { x: 300, y: -100 }),
    sp("s-choice-c", "選択肢C", "©️",
      { w: 200, h: 100, color: "#ff8844", radius: 12, border: "#cc6622" },
      { x: -300, y: -280 }),
    sp("s-choice-d", "選択肢D", "🅳",
      { w: 200, h: 100, color: "#cc44ff", radius: 12, border: "#9922cc" },
      { x: 300, y: -280 }),
    sp("s-timer-bar", "タイマーバー", "⏱️",
      { w: 4, h: 4, color: "#000000" },
      { x: 0, y: 0 },
      { visible: false }),
  ],
  pseudocode: `
class 問題管理 {
  var score = 0
  var level = 1
  var num1 = 0
  var num2 = 0
  var answer = 0
  var correct = 0
  var gameOver = 0
  var timeLeft = 100
  onCreate() {
    this.hide()
    this.score = 0
    this.level = 1
    this.num1 = 0
    this.num2 = 0
    this.answer = 0
    this.correct = 0
    this.gameOver = 0
    this.timeLeft = 100
    this.setBackground("#1a1a2e")
    this.addTextAt("title", "算数チャレンジ", -200, 490, 48, "#ffffff")
    this.addTextAt("score", "SCORE: 0", -900, 490, 36, "#ffcc00")
    this.addTextAt("level", "Lv.1", 700, 490, 36, "#66ccff")
    this.addTextAt("question", "", -400, 280, 64, "#ffffff")
    this.addTextAt("hint", "1〜4キーで回答", -200, 180, 28, "#888888")
    this.emit("new-question", "")
  }

  onUpdate() {
    if (this.gameOver == 0) {
      this.timeLeft += -0.3
      this.graphics.clear()
      if (this.timeLeft > 30) {
        this.graphics.fillRect(-400, 380, this.timeLeft * 8, 30, "#00ff88")
      } else {
        this.graphics.fillRect(-400, 380, this.timeLeft * 8, 30, "#ff4444")
      }
      if (this.timeLeft < 1) {
        this.gameOver = 1
        this.updateTextAt("question", "TIME UP!")
        this.cameraShake(300, 0.03)
        this.emit("game-ended", "")
      }
    }
  }

  onEvent("new-question") {
    this.level = 1 + floor(this.score / 50)
    this.updateTextAt("level", join("Lv.", this.level))
    this.num1 = randomInt(1, 5 + this.level * 3)
    this.num2 = randomInt(1, 5 + this.level * 2)
    this.answer = this.num1 + this.num2
    if (this.level > 2) {
      if (randomInt(0, 1) == 1) {
        this.answer = this.num1 * this.num2
        this.updateTextAt("question", join(join(join(this.num1, " × "), this.num2), " = ?"))
      } else {
        this.updateTextAt("question", join(join(join(this.num1, " + "), this.num2), " = ?"))
      }
    } else {
      this.updateTextAt("question", join(join(join(this.num1, " + "), this.num2), " = ?"))
    }
    this.correct = randomInt(1, 4)
    this.timeLeft = 100
    this.emit("set-choices", this.answer)
  }

  onEvent("correct-answer") {
    this.score += 10
    this.updateTextAt("score", join("SCORE: ", this.score))
    this.timeLeft = 100
    this.playSound("correct")
    this.emitParticles(0, 200, 20, "#ffcc00", 200)
    this.emit("new-question", "")
  }

  onEvent("wrong-answer") {
    this.timeLeft += -20
    this.playSound("wrong")
    this.cameraShake(200, 0.02)
    this.emitParticles(0, 200, 10, "#ff3333", 150)
  }
}

class 選択肢A {
  var myValue = 0
  var answer = 0
  var active = 1
  var mySlot = 1
  onCreate() {
    this.myValue = 0
    this.answer = 0
    this.active = 1
    this.mySlot = 1
  }

  onEvent("set-choices") {
    this.answer = eventData
    if (問題管理.correct == this.mySlot) {
      this.myValue = this.answer
    } else {
      this.myValue = this.answer + randomInt(1, 5)
    }
    this.say(join("1: ", this.myValue))
    this.tweenScale(1.1, 0.1)
  }

  onEvent("game-ended") {
    this.active = 0
  }

  onUpdate() {
    if (this.active == 1) {
      if (isKeyJustDown("1")) {
        if (this.myValue == this.answer) {
          this.floatingText("⭕ 正解!")
          this.emit("correct-answer", "")
        } else {
          this.floatingText("❌")
          this.emit("wrong-answer", "")
        }
      }
    }
  }
}

class 選択肢B {
  var myValue = 0
  var answer = 0
  var active = 1
  var mySlot = 2
  onCreate() {
    this.myValue = 0
    this.answer = 0
    this.active = 1
    this.mySlot = 2
  }

  onEvent("set-choices") {
    this.answer = eventData
    if (問題管理.correct == this.mySlot) {
      this.myValue = this.answer
    } else {
      this.myValue = this.answer + randomInt(-5, -1)
    }
    this.say(join("2: ", this.myValue))
    this.tweenScale(1.1, 0.1)
  }

  onEvent("game-ended") {
    this.active = 0
  }

  onUpdate() {
    if (this.active == 1) {
      if (isKeyJustDown("2")) {
        if (this.myValue == this.answer) {
          this.floatingText("⭕ 正解!")
          this.emit("correct-answer", "")
        } else {
          this.floatingText("❌")
          this.emit("wrong-answer", "")
        }
      }
    }
  }
}

class 選択肢C {
  var myValue = 0
  var answer = 0
  var active = 1
  var mySlot = 3
  onCreate() {
    this.myValue = 0
    this.answer = 0
    this.active = 1
    this.mySlot = 3
  }

  onEvent("set-choices") {
    this.answer = eventData
    if (問題管理.correct == this.mySlot) {
      this.myValue = this.answer
    } else {
      this.myValue = this.answer + randomInt(2, 8)
    }
    this.say(join("3: ", this.myValue))
    this.tweenScale(1.1, 0.1)
  }

  onEvent("game-ended") {
    this.active = 0
  }

  onUpdate() {
    if (this.active == 1) {
      if (isKeyJustDown("3")) {
        if (this.myValue == this.answer) {
          this.floatingText("⭕ 正解!")
          this.emit("correct-answer", "")
        } else {
          this.floatingText("❌")
          this.emit("wrong-answer", "")
        }
      }
    }
  }
}

class 選択肢D {
  var myValue = 0
  var answer = 0
  var active = 1
  var mySlot = 4
  onCreate() {
    this.myValue = 0
    this.answer = 0
    this.active = 1
    this.mySlot = 4
  }

  onEvent("set-choices") {
    this.answer = eventData
    if (問題管理.correct == this.mySlot) {
      this.myValue = this.answer
    } else {
      this.myValue = this.answer + randomInt(-8, -2)
    }
    this.say(join("4: ", this.myValue))
    this.tweenScale(1.1, 0.1)
  }

  onEvent("game-ended") {
    this.active = 0
  }

  onUpdate() {
    if (this.active == 1) {
      if (isKeyJustDown("4")) {
        if (this.myValue == this.answer) {
          this.floatingText("⭕ 正解!")
          this.emit("correct-answer", "")
        } else {
          this.floatingText("❌")
          this.emit("wrong-answer", "")
        }
      }
    }
  }
}

class タイマーバー {
}
`,
}
