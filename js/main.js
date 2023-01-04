const colors = {
  background: 'var(--background-color, black)',
  notes: 'var(--notes-color, white)',
  dissonance: 'var(--dissonance-color, #aaa)',
  consonance: 'var(--consonance-color, #555)',
}

const diameter = 100
const radius = diameter / 2

const draw = SVG().addTo('#music')
  .size('100%', '100%')
  .viewbox(`-${radius} -${radius} ${diameter} ${diameter}`)

const outerThickness = 20
const outerStrokeMiddle = radius - outerThickness / 2
const outerDiameter = diameter - outerThickness
const innerDiameter = outerDiameter - outerThickness

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
  stroke: colors.background,
  'stroke-width': 0.66,
})

const mainCircle = draw.circle(outerDiameter).attr({
  cx: 0,
  cy: 0,
  fill: 'none',
  stroke: colors.background,
  'stroke-width': outerThickness,
})

const outerGroup = draw.group()
const dissonanceGroup = outerGroup.group()
const consonanceGroup = outerGroup.group()

const notesGroup = draw.group().attr({
  'font-size': `${2*outerThickness}%`,
  'text-anchor': 'middle',
  'fill': colors.notes,
  'dominant-baseline': 'middle',
})

;(function drawOutside() {
  for (const [i, name] of notes.entries()) {
    const [x, y] = createCoords(outerStrokeMiddle, i)

    notesGroup.text(name).attr({x, y})

    const strokeRatio = outerThickness / diameter
    const extension = 1 - strokeRatio - 0.07
    notchesGroup.line(x, y, extension*x, extension*y)

    if (major6thScale[i]) {
      const isDissonance = i % 3 === 0
      const isTonic = i === 1
      const group = isDissonance ? dissonanceGroup : consonanceGroup

      group.circle(0.75*outerThickness).attr({
        cx: x,
        cy: y,
        fill: isDissonance ? colors.dissonance : colors.consonance,
        stroke: isTonic ? colors.notes : 'none',
        'stroke-width': isTonic ? 0.9*strokeRatio : 0,
        'stroke-dasharray': isTonic ? 5.9*strokeRatio : 'none',
      })
    }
  }
})()

const innerGroup = draw.group()
const innerConsonanceGroup = innerGroup.group()
const innerDissonanceGroup = innerGroup.group()

;(function drawInside() {
  const p = 2/3
  const strokeWidth = 0.5
  const hypotenuse = innerDiameter / Math.SQRT2
  const size = p*hypotenuse
  const radius = innerDiameter / 2
  const smallRadius = p*radius
  const middleRadius = radius - (radius - smallRadius) / (1 / p)

  const createGradient = () => draw.gradient('linear', function(add) {
    add.stop(0, colors.consonance)
    add.stop(0.5, colors.consonance)
    add.stop(0.5, colors.dissonance)
    add.stop(1, colors.dissonance)
  })

  const attrs = {
    stroke: colors.background,
    'stroke-width': strokeWidth,
    fill: 'none',
  }

  const gradient = createGradient().rotate(90)
  innerConsonanceGroup.circle(middleRadius*2).attr({
    ...attrs,
    cx: 0,
    cy: 0,
    fill: gradient,
    stroke: 'none',
  })

  innerDissonanceGroup.rect({
    ...attrs,
    width: size,
    height: size,
    x: -size/2,
    y: -size/2,
  }).transform({rotate: 45}).addClass('relation')

  innerConsonanceGroup.polygon([
    [0, smallRadius-strokeWidth+strokeWidth/2],
    createCoords(smallRadius, 1),
    createCoords(smallRadius, 5),
  ]).attr({...attrs}).addClass('relation')

  innerConsonanceGroup.polygon([
    [0, smallRadius-strokeWidth-strokeWidth/2],
    createCoords(smallRadius, 2),
    createCoords(smallRadius, 4),
  ]).attr({...attrs}).addClass('relation')
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
    dragState.groups = e.altKey ? [consonanceGroup, innerConsonanceGroup] : [outerGroup, innerGroup]
    dragState.steps = e.altKey ? 4 : 12
    dragState.valid = true
  }
})

draw.on('mousemove', function (e) {
  if (!dragState.valid) return

  const [x, y] = calcCoords(e)

  const radians = Math.atan2(y, x) - Math.atan2(dragState.y, dragState.x)
  const angle = Number.isNaN(radians) ? 0 : radians * 180 / Math.PI

  for (const group of dragState.groups) {
    group.transform({rotate: angle, origin: [0, 0]}, true)
  }

  dragState.x = x
  dragState.y = y
})

draw.on('mouseup', function (e) {
  const {steps, groups} = dragState
  for (const group of groups) {
    const angle = group.transform('rotate')
    const i = Math.round(steps * angle / 360)
    group.animate().transform({rotate: i*360/steps, origin: [0, 0]})
  }
  dragState.valid = false
  dragState.groups = []
})
