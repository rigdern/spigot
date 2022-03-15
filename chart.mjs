import { makeElement, div, h3, hr, br, text } from "./utils.mjs"

export function makeChart(args) {
  const {
    coordinates,
    xRange,
    yRange,
    caption,
  } = args;
  const [minX, maxX] = xRange;
  // const minX = Math.min.apply(Math, coordinates.map(coord => coord[0]));
  // const maxX = Math.max.apply(Math, coordinates.map(coord => coord[0]));
  const rebasedMaxX = maxX - minX;

  const [minY, maxY] = yRange;
  // const minY = Math.min.apply(Math, coordinates.map(coord => coord[1]));
  // const maxY = Math.max.apply(Math, coordinates.map(coord => coord[1]));
  const rebasedMaxY = maxY - minY;

  const canvasMaxX = 300;
  const canvasMaxY = 150;

  const canvas = makeElement('canvas', []);
  const ctx = canvas.getContext('2d');

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(10, canvasMaxY - 10);
  ctx.lineTo(10, 10);
  ctx.strokeStyle = 'black';
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(10, canvasMaxY - 10);
  ctx.lineTo(canvasMaxX - 10, canvasMaxY - 10);
  ctx.strokeStyle = 'black';
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  coordinates.forEach(([x, y], index) => {
    const rebasedX = x - minX;
    const rebasedY = y - minY;
    const canvasX = (canvasMaxX - 20) / rebasedMaxX * rebasedX + 10;
    const canvasY = canvasMaxY - 10 - ((canvasMaxY - 20) / rebasedMaxY * rebasedY);

    //console.log('x: ' + canvasX + ', y: ' + canvasY);

    if (index === 0) {
      ctx.moveTo(canvasX, canvasY);
    } else {
      ctx.lineTo(canvasX, canvasY);
    }
  });

  ctx.strokeStyle = 'red';
  ctx.stroke();
  ctx.restore();

  return div([
    canvas,
    text(caption),
    br(),
    br(),
  ]);
}
