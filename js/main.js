const diameter = 100
const radius = diameter / 2

const draw = SVG().addTo('#music')
  .size('100%', '100%')
  .viewbox(`-${radius} -${radius} ${diameter} ${diameter}`)

const outerThickness = 20
const outerStrokeMiddle = radius - outerThickness / 2

draw.circle(diameter - outerThickness).attr({
  cx: 0,
  cy: 0,
  fill: 'none',
  stroke: 'var(--background-color, black)',
  'stroke-width': outerThickness,
})

const notes = ['F', 'C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭']
const major6thScale = notes.map((_, i) => i < 7 || i === 9)

function createCoords(radius, i) {
  const inc = 2*Math.PI / 12;
  const radians = -Math.PI + inc*i;

  return [
    radius*Math.cos(radians),
    radius*Math.sin(radians),
  ]
}

const notchesGroup = draw.group().attr({
  stroke: 'var(--background-color, black)',
  'stroke-width': 0.66,
})

const major6thScaleGroup = draw.group()

const notesGroup = draw.group().attr({
  'font-size': `${2*outerThickness}%`,
  'text-anchor': 'middle',
  'fill': 'var(--notes-color, white)',
  'dominant-baseline': 'middle',
  'transform-origin': 'center',
})

for (const [i, name] of notes.entries()) {
  const [x, y] = createCoords(outerStrokeMiddle, i)
  
  notesGroup.text(name).attr({x, y})

  const circleRatio = outerThickness / diameter
  const extension = 1 - circleRatio - .08
  notchesGroup.line(x, y, extension*x, extension*y)

  if (major6thScale[i]) {
    major6thScaleGroup.circle(0.75*outerThickness).attr({
      cx: x,
      cy: y,
      fill: i % 3 === 0 ? 'var(--dissonance-color, #aaa)' : 'var(--consonance-color, #555)',
      stroke: i == 1 ? 'var(--notes-color, white)' : 'none',
      'stroke-width': i == 1 ? 0.9*circleRatio : 0,
      'stroke-dasharray': i == 1 ? 5.9*circleRatio : 'none',
    })
  }
}

const dragState = {}

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

  const radians = Math.atan2(y, x) - Math.atan2(dragState.y, dragState.x)
  const angle = Number.isNaN(radians) ? 0 : radians * 180 / Math.PI

  major6thScaleGroup.transform({rotate: angle}, true)

  dragState.x = x
  dragState.y = y
})

draw.on('mouseup', function (e) {
  const angle = major6thScaleGroup.transform('rotate')
  const i = Math.round(12 * angle / 360)
  major6thScaleGroup.animate().transform({rotate: i*360/12})
  dragState.valid = false
})
