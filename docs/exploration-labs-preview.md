# Field Labs and Outbreak Resistance preview

Open the guide at [http://127.0.0.1:5174/rendering/palettes](http://127.0.0.1:5174/rendering/palettes) after starting the web app from the repository root:

```sh
npm run dev --workspace @sporeward/web -- --host 127.0.0.1 --port 5174
```

The Field Labs section follows the outbreak cards and map-marker examples. Use **Player A / Player B** to inspect each player's collection state. **Collect lab** disables the lab for that player only; **Next reward name** cycles the flavour-name pool. The full-width map combines accepted Richer outbreaks, a soft blue-teal personal resistance field and a detailed survey station over the bundled Tampere/Iidesjärvi OSM snapshot. Collected labs have an empty chamber, a slumped support and a personal check. Controls below the map provide local cleaning, passive recovery, overlay visibility and **Reset study**. Resistance contours strengthen with resistance, while the roads stay readable above the field.

Move the distance slider to compare local opportunity values and the next lab offer. **Start simulated outing** freezes the advertised offer and its reference distance while the slider moves; end the outing to calculate the next offer. **Preview next lab reward** applies that offer to the selected player's resistance. The page-level **Bright map** and **Pause motion** controls apply to the study.

The map uses a bundled real geographic snapshot; outbreaks, the resistance centre and the lab are illustrative placements. The distance slider explores offers independently of the fixed map placement. All players, rewards, percentages and time changes are local illustrative fixtures. No field account, score, recording, server, or live outbreak state is read or changed. The distance curve, 42% cap, collection diminishing factor, point reduction, recovery steps, resistance centre and radius are provisional examples, not implemented gameplay balance. This preview does not implement the Field Lab or Outbreak Resistance in the server or Android app.

The approved resistance hue is fixed at 227°. The temporary colour-tuning slider has been removed.
