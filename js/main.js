const diameter = 100
const radius = diameter / 2

const draw = SVG().addTo('#music')
  .size('100%', '100%')
  .viewbox(`-${radius} -${radius} ${diameter} ${diameter}`)

const outerThickness = 20
const outerStrokeMiddle = radius - outerThickness / 2
const outerDiameter = diameter - outerThickness
const innerDiameter = outerDiameter - outerThickness

draw.circle(outerDiameter).attr({
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

const dissonanceGroup = major6thScaleGroup.group()
const consonanceGroup = major6thScaleGroup.group()

const notesGroup = draw.group().attr({
  'font-size': `${2*outerThickness}%`,
  'text-anchor': 'middle',
  'fill': 'var(--notes-color, white)',
  'dominant-baseline': 'middle',
})

for (const [i, name] of notes.entries()) {
  const [x, y] = createCoords(outerStrokeMiddle, i)
  
  notesGroup.text(name).attr({x, y})

  const strokeRatio = outerThickness / diameter
  const extension = 1 - strokeRatio - 0.08
  notchesGroup.line(x, y, extension*x, extension*y)

  if (major6thScale[i]) {
    const isDissonance = i % 3 === 0
    const isTonic = i === 1
    const group = isDissonance ? dissonanceGroup : consonanceGroup

    group.circle(0.75*outerThickness).attr({
      cx: x,
      cy: y,
      fill: isDissonance ? 'var(--dissonance-color, #aaa)' : 'var(--consonance-color, #555)',
      stroke: isTonic ? 'var(--notes-color, white)' : 'none',
      'stroke-width': isTonic ? 0.9*strokeRatio : 0,
      'stroke-dasharray': isTonic ? 5.9*strokeRatio : 'none',
    })
  }
}

(function drawInside() {
  const padding = 0.15
  const strokeWidth = 0.5
  const attrs = {
    stroke: 'var(--background-color, black)',
    'stroke-width': strokeWidth,
    fill: 'none'
  }
  const size = (1-padding)*(innerDiameter / Math.sqrt(2))

  dissonanceGroup.rect({
    ...attrs,
    width: size,
    height: size,
    x: -size/2,
    y: -size/2
  }).transform({rotate: 45})

  const radius = (1-padding)*(innerDiameter / 2)

  consonanceGroup.polygon([[0, radius-strokeWidth+0.2], createCoords(radius, 1), createCoords(radius, 5)]).attr({...attrs})

  consonanceGroup.polygon([[0, radius-strokeWidth-0.2], createCoords(radius, 2), createCoords(radius, 4)]).attr({...attrs})
})()

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
    dragState.alt = e.altKey
    dragState.valid = true
  }
})

draw.on('mousemove', function (e) {
  if (!dragState.valid) return

  const [x, y] = calcCoords(e)

  const radians = Math.atan2(y, x) - Math.atan2(dragState.y, dragState.x)
  const angle = Number.isNaN(radians) ? 0 : radians * 180 / Math.PI

  const group = dragState.alt ? consonanceGroup : major6thScaleGroup
  group.transform({rotate: angle, origin: [0, 0]}, true)

  dragState.x = x
  dragState.y = y
})

draw.on('mouseup', function (e) {
  const group = dragState.alt ? consonanceGroup : major6thScaleGroup
  const angle = group.transform('rotate')
  const steps = dragState.alt ? 4 : 12
  const i = Math.round(steps * angle / 360)
  group.animate().transform({rotate: i*360/steps, origin: [0, 0]})
  dragState.valid = false
})
