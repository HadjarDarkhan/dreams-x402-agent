# dreams (lucid-dreams / agent-kit)

Проєкт, який імітує результат:
```bash
npx @lucid-dreams/create-agent-kit dreams
```
(пакет існує в npm: див. https://www.npmjs.com/package/@lucid-dreams/create-agent-kit )

Тут ми вже одразу додали 4 entrypoints з оплатою через x402.

## Запуск

```bash
bun install
bun run dev
# або
bun run start
```

Env:
- PAY_TO_ADDRESS — твоя адреса у Base
- X402_NETWORK=base
- FACILITATOR_URL=https://x402.cdp.coinbase.com/facilitator
