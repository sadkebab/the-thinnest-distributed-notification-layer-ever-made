PORT=44443 HOST=localhost PUSH_KEY=debug tsx src/index.ts localhost:3001 &
P1=$!
PORT=44444 HOST=localhost PUSH_KEY=debug tsx src/index.ts localhost:3001 &
P2=$!
PORT=44445 HOST=localhost PUSH_KEY=debug tsx src/index.ts localhost:3001 &
P3=$!
PORT=44446 HOST=localhost PUSH_KEY=debug tsx src/index.ts localhost:3001 &
P4=$!
wait $P1 $P2 $P3 $P4
