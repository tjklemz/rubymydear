const diameter = 100
const radius = diameter / 2

const draw = SVG().addTo('#music')
  .size('100%', '100%')
  .viewbox(`-${radius} -${radius} ${diameter} ${diameter}`)

const outerThickness = 17
const outerStrokeMiddle = radius - outerThickness / 2

const musicCircle = draw.circle(diameter - outerThickness).attr({
  cx: 0,
  cy: 0,
  fill: 'none',
  stroke: 'var(--background-color, black)',
  'stroke-width': outerThickness,
})

const notes = ['F', 'C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭']
const major6thScale = notes.map((_, i) => i < 7 || i === 9)

function createCoords(radius, i) {
  var inc = 2*Math.PI / 12;
  var radians = -Math.PI + inc*i;

  return {
    x: radius*Math.cos(radians),
    y: radius*Math.sin(radians),
    angle: radians*180/Math.PI,
    radians,
  }
}

const notchesGroup = draw.group().attr({
  stroke: 'var(--background-color, black)',
})

const major6thScaleGroup = draw.group().attr({
  stroke: 'var(--notes-color, white)',
})

const notesGroup = draw.group().attr({
  'font-size': '40%',
  'font-family': '"Courier New", "Noto Music", sans-serif',
  'text-anchor': 'middle',
  'fill': 'var(--notes-color, white)',
  'dominant-baseline': 'middle',
  'transform-origin': 'center',
})

for (const [i, name] of notes.entries()) {
  const {x, y} = createCoords(outerStrokeMiddle, i)
  
  notesGroup.text(name).attr({
    x,
    y,
  })//.click(() => rotateScale(i))

  notchesGroup.line(x, y, 0.75*x, 0.75*y)

  if (major6thScale[i]) {
    major6thScaleGroup.circle(0.75*outerThickness).attr({
      cx: x,
      cy: y,
      fill: i % 3 === 0 ? 'var(--dissonance-color, #aaa)' : 'var(--consonance-color, #555)',
      'stroke-width': 0.2,
    })
  }
}

function rotateScale(i) {
  major6thScaleGroup.animate().transform({
    rotate: createCoords(outerStrokeMiddle, i - 7).angle,
    origin: [0, 0],
  })
}

const dragState = {
  x: 0,
  y: 0,
  valid: false,
}

function calcCoords (e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * diameter - radius
  const y = ((e.clientY - rect.top) / rect.height) * diameter - radius

  return [x, y]
}

draw.on('mousedown', function (e) {
  const [x, y] = calcCoords(e)

  const dist = Math.sqrt(x*x + y*y)
  if (dist <= radius && dist >= radius - outerThickness) {
    dragState.x = x
    dragState.y = y
    dragState.valid = true
    console.log('mousedown', x, y);
  }
})

draw.on('mousemove', function (e) {
  if (!dragState.valid) return

  const [x, y] = calcCoords(e)

  // const radians = Math.acos(
  //   (dragState.x * x + dragState.y * y) /
  //   (Math.sqrt(dragState.x*dragState.x + dragState.y*dragState.y) * Math.sqrt(x*x + y*y))
  // )
  const radians = Math.atan2(y, x) - Math.atan2(dragState.y, dragState.x)
  const angle = Number.isNaN(radians) ? 0 : radians * 180 / Math.PI
  //console.log('angle', angle)

  major6thScaleGroup.transform({
    rotate: angle,
    origin: [0, 0],
  }, true)

  dragState.x = x
  dragState.y = y
})

draw.on('mouseup', function (e) {
  const i = Math.round(12 * major6thScaleGroup.transform('rotate') / 360)
  console.log('i', i)
  major6thScaleGroup.animate().transform({
    rotate: i*360/12
  })
  dragState.valid = false
})