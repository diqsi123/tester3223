// @ts-nocheck
// Supplied Chatus motion export. Original visual settings retained.
const CHATUS_ASSETS = {"logo":"data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIHZpZXdCb3g9IjAgMCAxODAgMTgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZyBpZD0iRnJhbWUgMjE0NzIyNDIwNiI+CjxnIGlkPSJDaGF0dXMiPgo8cGF0aCBkPSJNMjUuNzQ1OSAxMDUuMjQ5QzIyLjU5MjIgMTA1LjI0OSAyMC4wODQyIDEwNC42MzggMTguMjIxNyAxMDMuNDE3QzE2LjM2NDMgMTAyLjE4MiAxNS4yMzIxIDEwMC40MTkgMTQuODI1IDk4LjEyODNDMTQuNDIyOSA5NS44MjMzIDE0LjgxMTEgOTMuMDUxOSAxNS45ODk1IDg5LjgxNDFMMTUuOTk3IDg5Ljc5MzVDMTcuMTcwNSA4Ni41NjkzIDE4Ljc5NDggODMuODExNyAyMC44Njk3IDgxLjUyMDVDMjIuOTY0MyA3OS4yMTU1IDI1LjM3OTkgNzcuNDUyNSAyOC4xMTY1IDc2LjIzMTVDMzAuODY3OCA3NS4wMTA0IDMzLjgyMDMgNzQuMzk5OSAzNi45NzM5IDc0LjM5OTlDMzkuNzA0MiA3NC4zOTk5IDQxLjkzNTggNzQuOTA3NSA0My42Njg3IDc1LjkyMjhDNDUuNDA2NiA3Ni45MjQzIDQ2LjU3MTcgNzguMjk2MyA0Ny4xNjM5IDgwLjAzODdDNDcuNzU2MiA4MS43ODExIDQ3LjY5ODkgODMuNzYzNiA0Ni45OTIxIDg1Ljk4NjJMNDYuOTMxNiA4Ni4yMTI2SDM5LjE3ODlMMzkuMjQgODUuOTI0NUMzOS40NTM5IDg0Ljg5NTUgMzkuNDIwOSA4My45ODMyIDM5LjE0MTIgODMuMTg3NEMzOC44NzYgODIuMzkxNyAzOC4zNzA3IDgxLjc3NDMgMzcuNjI1MiA4MS4zMzUyQzM2Ljg4NDggODAuODgyNSAzNS45MDg3IDgwLjY1NjEgMzQuNjk2OSA4MC42NTYxQzMzLjIyMjIgODAuNjU2MSAzMS44MTk3IDgxLjAxOTcgMzAuNDg5MiA4MS43NDY4QzI5LjE1ODcgODIuNDc0IDI3Ljk1NDMgODMuNTE2NyAyNi44NzU5IDg0Ljg3NDlDMjUuNzk3NSA4Ni4yMzMyIDI0LjkxMTMgODcuODY1OSAyNC4yMTcyIDg5Ljc3MjlMMjQuMjA5NyA4OS43OTM1QzIzLjUxMDYgOTEuNzE0MyAyMy4yMDM0IDkzLjM2MDYgMjMuMjg4IDk0LjczMjZDMjMuMzcyNyA5Ni4xMDQ2IDIzLjgxMzEgOTcuMTYxIDI0LjYwOTMgOTcuOTAxOUMyNS40MjUgOTguNjI5IDI2LjU2MjkgOTguOTkyNiAyOC4wMjI5IDk4Ljk5MjZDMjkuMTkxIDk4Ljk5MjYgMzAuMzA1IDk4Ljc3OTkgMzEuMzY1IDk4LjM1NDZDMzIuNDMgOTcuOTE1NiAzMy4zOTkzIDk3LjI5ODIgMzQuMjczIDk2LjUwMjVDMzUuMTQ2NiA5NS43MDY3IDM1Ljg3NTYgOTQuNzY2OSAzNi40NTk5IDkzLjY4M0wzNi41NjQyIDkzLjQ1NjdINDQuMzE2OUw0NC4yMjcgOTMuNzAzNkM0My4zMDEzIDk1LjkyNjIgNDEuOTAwOCA5Ny45MDg3IDQwLjAyNTYgOTkuNjUxMUMzOC4xNyAxMDEuMzggMzYuMDA4NyAxMDIuNzQ1IDMzLjU0MTcgMTAzLjc0NkMzMS4wNzQ3IDEwNC43NDggMjguNDc2MSAxMDUuMjQ5IDI1Ljc0NTkgMTA1LjI0OVoiIGZpbGw9IiMyQTFCMDAiLz4KPHBhdGggZD0iTTQyLjYzNDEgMTA0LjY3M0w1My41NjI2IDc0LjY0NjlINjEuMzE1M0w1Ny4xMzU3IDg2LjEzMDNINTcuMzU0N0M1OC40NTggODQuNzAzNCA1OS43NTU0IDgzLjYwNTkgNjEuMjQ2OSA4Mi44Mzc2QzYyLjc1MyA4Mi4wNjkzIDY0LjM5NjYgODEuNjg1MSA2Ni4xNzc4IDgxLjY4NTFDNjcuOTI5OSA4MS42ODUxIDY5LjI5MTggODIuMDM1IDcwLjI2MzUgODIuNzM0N0M3MS4yNDAzIDgzLjQyMDYgNzEuODE1MSA4NC40MDg1IDcxLjk4ODIgODUuNjk4MUM3Mi4xODA4IDg2Ljk3NDEgNzEuOTQ3NSA4OC41MTc1IDcxLjI4ODMgOTAuMzI4Nkw2Ni4wNjc1IDEwNC42NzNINTguMjkyOUw2Mi45NDQ0IDkxLjg5MjZDNjMuNDI4OCA5MC41NjE4IDYzLjQ3OTggODkuNTE5MSA2My4wOTc0IDg4Ljc2NDVDNjIuNzE1MSA4OC4wMDk5IDYxLjg4MTUgODcuNjMyNiA2MC41OTY2IDg3LjYzMjZDNTkuNzc5IDg3LjYzMjYgNTkuMDAzNSA4Ny44MTc4IDU4LjI3MDEgODguMTg4M0M1Ny41NDE2IDg4LjU0NSA1Ni44OTIxIDg5LjA0NTggNTYuMzIxNiA4OS42OTA2QzU1Ljc3MDcgOTAuMzIxNyA1NS4zNDA1IDkxLjA2MjYgNTUuMDMwOSA5MS45MTMyTDUwLjM4NjggMTA0LjY3M0g0Mi42MzQxWiIgZmlsbD0iIzJBMUIwMCIvPgo8cGF0aCBkPSJNNzUuNzQ5NCAxMDUuMDAyQzc0LjE3MjYgMTA1LjAwMiA3Mi44ODU2IDEwNC43MDcgNzEuODg4NSAxMDQuMTE3QzcwLjkwNiAxMDMuNTI3IDcwLjI1NjUgMTAyLjcyNCA2OS45Mzk4IDEwMS43MDlDNjkuNjQyNyAxMDAuNjggNjkuNzMzOCA5OS41MDcxIDcwLjIxMzIgOTguMTlMNzAuMjIwNyA5OC4xNjk0QzcwLjczNSA5Ni43NTYzIDcxLjU0NDMgOTUuNTU1OCA3Mi42NDg0IDk0LjU2OEM3My43NjcyIDkzLjU4MDEgNzUuMTQ0MyA5Mi44MDUgNzYuNzc5OSA5Mi4yNDI1Qzc4LjQyMDUgOTEuNjY2MiA4MC4yOTI1IDkxLjMxNjQgODIuMzk2MSA5MS4xOTI5TDkyLjA1OTMgOTAuNjM3M0w5MC41MjM4IDk0Ljg1NjFMODIuMTIzOSA5NS4zNzA2QzgxLjAwMzkgOTUuNDM5MiA4MC4wOTE2IDk1LjY3OTMgNzkuMzg3IDk2LjA5MDlDNzguNzAyIDk2LjQ4ODcgNzguMjM5NiA5Ny4wMTY5IDc3Ljk5OTkgOTcuNjc1NUw3Ny45ODQ5IDk3LjcxNjdDNzcuNzMwMyA5OC40MTY0IDc3LjgxNzcgOTguOTU4MyA3OC4yNDczIDk5LjM0MjVDNzguNjkxNSA5OS43MjY2IDc5LjM5NTQgOTkuOTE4NyA4MC4zNTkgOTkuOTE4N0M4MS4xNzY2IDk5LjkxODcgODEuOTU5MSA5OS43NzQ2IDgyLjcwNjQgOTkuNDg2NUM4My40NTM2IDk5LjE5ODQgODQuMDk5NyA5OC44MDc0IDg0LjY0NDQgOTguMzEzNUM4NS4yMDg4IDk3LjgwNTggODUuNjAzMyA5Ny4yNDMzIDg1LjgyODEgOTYuNjI1OUw4OC4zNjczIDg5LjY0OTRDODguNjYxOSA4OC44NCA4OC42MDY5IDg4LjIwODkgODguMjAyMyA4Ny43NTYxQzg3LjgxNzMgODcuMjg5NiA4Ny4wOTE4IDg3LjA1NjQgODYuMDI2IDg3LjA1NjRDODQuOTc0OCA4Ny4wNTY0IDg0LjA3NTIgODcuMjQxNiA4My4zMjcxIDg3LjYxMkM4Mi41OTM3IDg3Ljk4MjUgODIuMDQ2NiA4OC40NjI3IDgxLjY4NTkgODkuMDUyNkw4MS41NzQ3IDg5LjIzNzhINzQuNTY2NUw3NC42ODU4IDg4Ljk3MDNDNzUuMzQ2NSA4Ny41MTYgNzYuMzI2OCA4Ni4yNDY5IDc3LjYyNjUgODUuMTYzMUM3OC45MzEyIDg0LjA2NTUgODAuNDk2NCA4My4yMTQ5IDgyLjMyMjEgODIuNjExMkM4NC4xNTI5IDgxLjk5MzggODYuMTcwNiA4MS42ODUxIDg4LjM3NTIgODEuNjg1MUM5MC41MzYxIDgxLjY4NTEgOTIuMjk3NCA4Mi4wMDA3IDkzLjY1OTEgODIuNjMxOEM5NS4wMjA4IDgzLjI2MjkgOTUuOTIyNiA4NC4xNTQ3IDk2LjM2NDYgODUuMzA3MUM5Ni44MjYxIDg2LjQ0NTkgOTYuNzc3MyA4Ny43ODM1IDk2LjIxOCA4OS4zMjAyTDkwLjYzMDIgMTA0LjY3M0g4Mi44OTkzTDg0LjAzNzkgMTAxLjU0NEg4My44MTg5QzgzLjEzMDggMTAyLjI3MiA4Mi4zNTYxIDEwMi44OTYgODEuNDk0NyAxMDMuNDE3QzgwLjYzODMgMTAzLjkyNSA3OS43MjIyIDEwNC4zMTYgNzguNzQ2MyAxMDQuNTlDNzcuNzg1IDEwNC44NjUgNzYuNzg2MSAxMDUuMDAyIDc1Ljc0OTQgMTA1LjAwMloiIGZpbGw9IiMyQTFCMDAiLz4KPHBhdGggZD0iTTEwMy43MDYgMTA1LjA2NEMxMDAuNzcxIDEwNS4wNjQgOTguODEwMSAxMDQuNTM1IDk3LjgyMjIgMTAzLjQ3OUM5Ni44MzQzIDEwMi40MjMgOTYuNzkyMyAxMDAuNjUzIDk3LjY5NjEgOTguMTY5NEwxMDEuNTY5IDg3LjUyOTdIOTguMjYxN0wxMDAuMjA5IDgyLjE3OUgxMDMuNTE2TDEwNS40MDQgNzYuOTkyOUgxMTMuMkwxMTEuMzEzIDgyLjE3OUgxMTUuNjkzTDExMy43NDUgODcuNTI5N0gxMDkuMzY1TDEwNS44OTcgOTcuMDU4MUMxMDUuNTUzIDk4LjAwNDggMTA1LjUzOSA5OC42ODM5IDEwNS44NTYgOTkuMDk1NUMxMDYuMTc5IDk5LjQ5MzQgMTA2LjgxNCA5OS42OTIzIDEwNy43NjQgOTkuNjkyM0MxMDguMTE0IDk5LjY5MjMgMTA4LjQwOCA5OS42ODU0IDEwOC42NDcgOTkuNjcxN0MxMDguODkxIDk5LjY0NDMgMTA5LjEyNyA5OS42MTY4IDEwOS4zNTYgOTkuNTg5NEwxMDcuNDYxIDEwNC43OTZDMTA3LjAxMiAxMDQuODY1IDEwNi40NzIgMTA0LjkyNiAxMDUuODM4IDEwNC45ODFDMTA1LjIyIDEwNS4wMzYgMTA0LjUwOSAxMDUuMDY0IDEwMy43MDYgMTA1LjA2NFoiIGZpbGw9IiMyQTFCMDAiLz4KPHBhdGggZD0iTTExNy42NTMgMTA1LjE2NkMxMTUuODg3IDEwNS4xNjYgMTE0LjUxMyAxMDQuODMgMTEzLjUzMSAxMDQuMTU4QzExMi41NjQgMTAzLjQ4NiAxMTEuOTkxIDEwMi41MTIgMTExLjgxMyAxMDEuMjM2QzExMS42NSA5OS45NTk4IDExMS44OSA5OC40MzY5IDExMi41MzQgOTYuNjY3MUwxMTcuODA3IDgyLjE3OUgxMjUuNTgyTDEyMC44ODYgOTUuMDgyNUMxMjAuNDExIDk2LjM4NTggMTIwLjM1NiA5Ny40MDExIDEyMC43MTkgOTguMTI4M0MxMjEuMDk3IDk4Ljg1NTQgMTIxLjkyMSA5OS4yMTkgMTIzLjE5MSA5OS4yMTlDMTIzLjgxOSA5OS4yMTkgMTI0LjQxMSA5OS4xMTYxIDEyNC45NjggOTguOTEwM0MxMjUuNTM5IDk4LjcwNDUgMTI2LjA2NyA5OC40MTY0IDEyNi41NTIgOTguMDQ1OUMxMjcuMDU3IDk3LjY2MTggMTI3LjQ5MiA5Ny4yMDkgMTI3Ljg1NyA5Ni42ODc3QzEyOC4yMjIgOTYuMTY2MyAxMjguNTE5IDk1LjU5MDEgMTI4Ljc0OSA5NC45NTlMMTMzLjQwMSA4Mi4xNzlIMTQxLjE3NUwxMzIuOTg4IDEwNC42NzNIMTI1LjIxNEwxMjYuNjIyIDEwMC44MDRIMTI2LjQyNUMxMjUuNzAxIDEwMS43MDkgMTI0Ljg4MyAxMDIuNDkxIDEyMy45NzIgMTAzLjE1QzEyMy4wNzUgMTAzLjgwOCAxMjIuMDk3IDEwNC4zMDkgMTIxLjAzOCAxMDQuNjUyQzExOS45NzkgMTA0Ljk5NSAxMTguODUxIDEwNS4xNjYgMTE3LjY1MyAxMDUuMTY2WiIgZmlsbD0iIzJBMUIwMCIvPgo8cGF0aCBkPSJNMTQ2LjExNCAxMDUuMTY2QzE0My43MzQgMTA1LjE2NiAxNDEuODM5IDEwNC44NTggMTQwLjQyOSAxMDQuMjRDMTM5LjAxOCAxMDMuNjIzIDEzOC4wNTggMTAyLjc3MiAxMzcuNTQ3IDEwMS42ODlDMTM3LjAzNiAxMDAuNjA1IDEzNi45NTUgOTkuMzQyNSAxMzcuMzA0IDk3LjkwMTlMMTM3LjM0MiA5Ny43MzcySDE0NC44NzZMMTQ0Ljg2IDk3LjkwMTlDMTQ0LjgwNSA5OC42MTUzIDE0NS4wMTQgOTkuMTg0NyAxNDUuNDg3IDk5LjYxQzE0NS45NzkgMTAwLjAyMiAxNDYuNzg4IDEwMC4yMjcgMTQ3LjkxMiAxMDAuMjI3QzE0OC41OTggMTAwLjIyNyAxNDkuMjE3IDEwMC4xNTIgMTQ5Ljc2OCAxMDAuMDAxQzE1MC4zMiA5OS44NTAxIDE1MC43NzcgOTkuNjM3NCAxNTEuMTM5IDk5LjM2M0MxNTEuNTIyIDk5LjA3NDkgMTUxLjc4MyA5OC43Mzg4IDE1MS45MjIgOTguMzU0NkwxNTEuOTMgOTguMzM0QzE1Mi4xMTUgOTcuODI2NCAxNTIuMDQzIDk3LjQyMTcgMTUxLjcxNSA5Ny4xMTk4QzE1MS4zOTIgOTYuODA0MyAxNTAuNzM1IDk2LjU0MzYgMTQ5Ljc0NCA5Ni4zMzc4TDE0NS44MjQgOTUuNTU1OEMxNDQuMzY2IDk1LjI2NzcgMTQzLjIxMiA5NC44Mjg2IDE0Mi4zNjEgOTQuMjM4N0MxNDEuNTI0IDkzLjY0ODcgMTQwLjk5NiA5Mi45MTQ3IDE0MC43NzUgOTIuMDM2N0MxNDAuNTc0IDkxLjE0NDkgMTQwLjY4MSA5MC4xMjk2IDE0MS4wOTUgODguOTkwOUwxNDEuMTAzIDg4Ljk3MDNDMTQxLjY1MiA4Ny40NjExIDE0Mi41NTUgODYuMTY0NiAxNDMuODExIDg1LjA4MDdDMTQ1LjA2NyA4My45OTY5IDE0Ni41OTggODMuMTYgMTQ4LjQwNCA4Mi41N0MxNTAuMjI0IDgxLjk4MDEgMTUyLjIxNSA4MS42ODUxIDE1NC4zNzYgODEuNjg1MUMxNTYuNjk4IDgxLjY4NTEgMTU4LjUxNyA4Mi4wMjEyIDE1OS44MzUgODIuNjkzNUMxNjEuMTcyIDgzLjM1MiAxNjIuMDQyIDg0LjIzMDEgMTYyLjQ0NiA4NS4zMjc3QzE2Mi44NjQgODYuNDI1MyAxNjIuODQ4IDg3LjYzMjYgMTYyLjM5NyA4OC45NDk3TDE2Mi4zMzggODkuMTE0NEgxNTUuMjQyTDE1NS4yODcgODguOTI5MUMxNTUuNDI0IDg4LjMxMTcgMTU1LjI3OSA4Ny43Njk4IDE1NC44NSA4Ny4zMDMzQzE1NC40MjEgODYuODM2OSAxNTMuNjY2IDg2LjYwMzYgMTUyLjU4NiA4Ni42MDM2QzE1MS45NTggODYuNjAzNiAxNTEuMzgxIDg2LjY4NiAxNTAuODUzIDg2Ljg1MDZDMTUwLjMzMSA4Ny4wMDE1IDE0OS44ODYgODcuMjIxIDE0OS41MTkgODcuNTA5MUMxNDkuMTUxIDg3Ljc5NzMgMTQ4Ljg5NSA4OC4xNDAzIDE0OC43NSA4OC41MzgxTDE0OC43NDMgODguNTU4N0MxNDguNjIzIDg4Ljg4OCAxNDguNjA1IDg5LjE3NjEgMTQ4LjY5MSA4OS40MjMxQzE0OC43OTYgODkuNjU2MyAxNDkuMDMyIDg5Ljg2ODkgMTQ5LjQgOTAuMDYxQzE0OS43NzMgOTAuMjM5NCAxNTAuMzEyIDkwLjQwNCAxNTEuMDE2IDkwLjU1NDlMMTU0LjkzNyA5MS4zMzdDMTU3LjI5MyA5MS44MDM0IDE1OC44NjggOTIuNTMwNiAxNTkuNjYyIDkzLjUxODRDMTYwLjQ1NSA5NC41MDYyIDE2MC41NDggOTUuODM3IDE1OS45MzkgOTcuNTEwOUwxNTkuOTMxIDk3LjUzMTRDMTU5LjM2NyA5OS4wODE4IDE1OC40MDggMTAwLjQzMyAxNTcuMDU0IDEwMS41ODZDMTU1LjcyIDEwMi43MjQgMTU0LjEwNSAxMDMuNjA5IDE1Mi4yMTEgMTA0LjI0QzE1MC4zMzcgMTA0Ljg1OCAxNDguMzA0IDEwNS4xNjYgMTQ2LjExNCAxMDUuMTY2WiIgZmlsbD0iIzJBMUIwMCIvPgo8L2c+CjwvZz4KPC9zdmc+Cg==","heart":"data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgd2lkdGg9IjI3IiBoZWlnaHQ9IjIyIiB2aWV3Qm94PSIwIDAgMjcgMjIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGlkPSJWZWN0b3IiPgo8cGF0aCBkPSJNMTMuNTEgMjJDMzcuOTQgMTEuOTU4MyAyMy42OTg3IC03LjY0ODY2IDEzLjQ4MjUgMy4xNTQyN0MzLjI2NjMyIC03LjY0ODY2IC0xMC45MiAxMS45NTgzIDEzLjUxIDIyWiIgZmlsbD0iI0ZDRjhFQyIvPgo8cGF0aCBkPSJNMTMuNTEgMjJDMzcuOTQgMTEuOTU4MyAyMy42OTg3IC03LjY0ODY2IDEzLjQ4MjUgMy4xNTQyN0MzLjI2NjMyIC03LjY0ODY2IC0xMC45MiAxMS45NTgzIDEzLjUxIDIyWiIgZmlsbD0idXJsKCNwYWludDBfcmFkaWFsXzBfMzgxKSIvPgo8L2c+CjxkZWZzPgo8cmFkaWFsR3JhZGllbnQgaWQ9InBhaW50MF9yYWRpYWxfMF8zODEiIGN4PSIwIiBjeT0iMCIgcj0iMSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIGdyYWRpZW50VHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTMuNSAxNC42MjAzKSByb3RhdGUoOTApIHNjYWxlKDE0LjYyMDMgMTcuOTQzKSI+CjxzdG9wIHN0b3AtY29sb3I9IiNGRjA4OEUiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjRkZBQ0Q5Ii8+CjwvcmFkaWFsR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+Cg=="};
const CHATUS_GEOMETRY = {"letterD":"M75.7494 105.002C74.1726 105.002 72.8856 104.707 71.8885 104.117C70.906 103.527 70.2565 102.724 69.9398 101.709C69.6427 100.68 69.7338 99.5071 70.2132 98.19L70.2207 98.1694C70.735 96.7563 71.5443 95.5558 72.6484 94.568C73.7672 93.5801 75.1443 92.805 76.7799 92.2425C78.4205 91.6662 80.2925 91.3164 82.3961 91.1929L92.0593 90.6373L90.5238 94.8561L82.1239 95.3706C81.0039 95.4392 80.0916 95.6793 79.387 96.0909C78.702 96.4887 78.2396 97.0169 77.9999 97.6755L77.9849 97.7167C77.7303 98.4164 77.8177 98.9583 78.2473 99.3425C78.6915 99.7266 79.3954 99.9187 80.359 99.9187C81.1766 99.9187 81.9591 99.7746 82.7064 99.4865C83.4536 99.1984 84.0997 98.8074 84.6444 98.3135C85.2088 97.8058 85.6033 97.2433 85.8281 96.6259L88.3673 89.6494C88.6619 88.84 88.6069 88.2089 88.2023 87.7561C87.8173 87.2896 87.0918 87.0564 86.026 87.0564C84.9748 87.0564 84.0752 87.2416 83.3271 87.612C82.5937 87.9825 82.0466 88.4627 81.6859 89.0526L81.5747 89.2378H74.5665L74.6858 88.9703C75.3465 87.516 76.3268 86.2469 77.6265 85.1631C78.9312 84.0655 80.4964 83.2149 82.3221 82.6112C84.1529 81.9938 86.1706 81.6851 88.3752 81.6851C90.5361 81.6851 92.2974 82.0007 93.6591 82.6318C95.0208 83.2629 95.9226 84.1547 96.3646 85.3071C96.8261 86.4459 96.7773 87.7835 96.218 89.3202L90.6302 104.673H82.8993L84.0379 101.544H83.8189C83.1308 102.272 82.3561 102.896 81.4947 103.417C80.6383 103.925 79.7222 104.316 78.7463 104.59C77.785 104.865 76.7861 105.002 75.7494 105.002Z","apertureD":"M82.1239 95.3706 C81.0039 95.4392 80.0916 95.6793 79.387 96.0909 C78.702 96.4887 78.2396 97.0169 77.9999 97.6755 L77.9849 97.7167 C77.7303 98.4164 77.8177 98.9583 78.2473 99.3425 C78.6915 99.7266 79.3954 99.9187 80.359 99.9187 C81.1766 99.9187 81.9591 99.7746 82.7064 99.4865 C83.4536 99.1984 84.0997 98.8074 84.6444 98.3135 C85.2088 97.8058 85.6033 97.2433 85.8281 96.6259 L86.37986358232862 95.10991912723864Z","aperturePolygon":[[82.1239,95.3706],[81.95745774999999,95.38217625],[81.79413100000001,95.39632499999999],[81.63391975,95.41304625],[81.47682400000002,95.43234000000002],[81.32284374999999,95.45420625],[81.171979,95.47864499999997],[81.02422974999999,95.50565624999999],[80.87959599999999,95.53523999999999],[80.73807775000002,95.56739625000002],[80.59967499999999,95.60212499999999],[80.46438775000001,95.63942625],[80.33221600000002,95.67930000000001],[80.20315975,95.72174625],[80.077219,95.76676499999999],[79.95439375000001,95.81435625],[79.83468400000001,95.86452],[79.71808975,95.91725625000001],[79.604611,95.972565],[79.49424775,96.03044625000001],[79.387,96.0909],[79.2859195125,96.15154799999999],[79.18817810000002,96.214152],[79.09377583749999,96.27871199999998],[79.00271280000001,96.34522800000002],[78.9149890625,96.4137],[78.83060469999997,96.48412799999997],[78.74955978749999,96.55651199999998],[78.67185439999999,96.63085199999999],[78.59748861250002,96.70714800000002],[78.52646250000001,96.78540000000001],[78.4587761375,96.86560800000001],[78.3944296,96.94777200000001],[78.3334229625,97.031892],[78.2757563,97.11796799999999],[78.2214296875,97.206],[78.1704432,97.29598800000001],[78.1227969125,97.387932],[78.07849089999999,97.48183200000001],[78.0375252375,97.577688],[77.9999,97.6755],[77.9849,97.7167],[77.949275025,97.82047151249999],[77.91878020000001,97.9218761],[77.89341567499999,98.02091383749999],[77.87318160000001,98.11758480000003],[77.858078125,98.21188906249999],[77.84810539999998,98.30382669999999],[77.843263575,98.39339778749998],[77.8435528,98.4806024],[77.84897322500002,98.56544061250001],[77.85952499999999,98.64791249999999],[77.875208275,98.7280181375],[77.8960232,98.80575759999999],[77.92196992499998,98.88113096249998],[77.95304859999999,98.95413829999998],[77.989259375,99.0247796875],[78.0306024,99.09305520000001],[78.077077825,99.1589649125],[78.1286858,99.22250890000001],[78.185426475,99.2836872375],[78.2473,99.3425],[78.31587775000001,99.39867498749999],[78.388351,99.45196990000001],[78.46471975,99.50238466249999],[78.54498400000001,99.54991920000003],[78.62914375000001,99.5945734375],[78.71719899999997,99.63634729999998],[78.80914975,99.6752407125],[78.90499599999998,99.71125359999999],[79.00473775000002,99.74438588750003],[79.10837500000001,99.77463749999998],[79.21590775,99.8020083625],[79.327336,99.8264984],[79.44265974999999,99.8481075375],[79.56187899999999,99.8668357],[79.68499374999999,99.88268281250001],[79.812004,99.8956488],[79.94290975,99.9057335875],[80.077711,99.91293710000001],[80.21640774999999,99.9172592625],[80.359,99.9187],[80.48137673749999,99.91761926249998],[80.60322690000002,99.91437710000001],[80.72455041249998,99.9089735875],[80.8453472,99.90140880000003],[80.9656171875,99.89168281250001],[81.08536029999998,99.87979569999999],[81.2045764625,99.8657475375],[81.32326559999998,99.84953839999999],[81.44142763750001,99.83116836250002],[81.5590625,99.8106375],[81.67617011249999,99.7879458875],[81.7927504,99.76309360000002],[81.90880328749999,99.7360807125],[82.0243287,99.70690729999998],[82.1393265625,99.6755734375],[82.2537968,99.64207920000001],[82.3677393375,99.6064246625],[82.48115410000001,99.56860990000001],[82.59404101250001,99.52863498750001],[82.7064,99.4865],[82.8177217125,99.44251324999999],[82.92752670000002,99.39698300000002],[83.03581473749999,99.34990925],[83.14258560000003,99.30129200000005],[83.24783906249999,99.25113125],[83.35157489999997,99.19942699999997],[83.4537928875,99.14617924999999],[83.55449279999998,99.091388],[83.65367441250002,99.03505325000002],[83.75133749999999,98.977175],[83.8474818375,98.91775325],[83.9421072,98.85678800000002],[84.0352133625,98.79427924999999],[84.1268001,98.73022699999999],[84.2168671875,98.66463125000001],[84.30541439999999,98.597492],[84.3924415125,98.52880925],[84.47794830000001,98.458583],[84.56193453750001,98.38681325000002],[84.6444,98.3135],[84.727785775,98.2369339875],[84.8086232,98.15954590000003],[84.886912425,98.0813356625],[84.96265360000002,98.00230320000003],[85.03584687499999,97.92244843750001],[85.1064924,97.84177129999999],[85.174590325,97.76027171250001],[85.2401408,97.67794959999999],[85.30314397500001,97.59480488750002],[85.36359999999999,97.51083750000001],[85.421509025,97.42604736249999],[85.4768712,97.3404344],[85.529686675,97.2539985375],[85.57995559999999,97.1667397],[85.627678125,97.07865781250001],[85.6728544,96.98975280000002],[85.715484575,96.90002458750001],[85.75556880000002,96.8094731],[85.79310722500001,96.7180982625],[85.8281,96.6259],[86.37986358232862,95.10991912723864]]};
const LUMA_SETTINGS = {"speed":0.7,"intensity":1.25,"width":0.95,"bend":1.15,"quality":1,"fps":60,"respectReducedMotion":true};
function createLumaRenderer(host, options) {
  const canvas=document.createElement('canvas');canvas.className='luma-canvas';host.append(canvas);
  const context=canvas.getContext('2d',{alpha:false});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let last=-1, pixels;
  function render(timeMs) {
    const o=options;
    const time=o.respectReducedMotion&&reduced.matches?0:Math.floor(timeMs/1000*o.fps)/o.fps;
    if(time===last)return;last=time;
    const w=Math.round(120*Math.max(0.5,o.quality)),h=Math.round(w*874/402);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;pixels=context.createImageData(w,h);}
    const t=time*o.speed*0.32;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const u=x/w,v=y/h;
      const axis=v*2.3-u*0.75+o.bend*0.18*Math.sin(u*3.2+t);
      const light=(Math.sin(axis*3.2-t)+1)/2;
      const soft=Math.pow(light,1/Math.max(0.3,o.width));
      const value=Math.min(1,Math.max(0,soft*o.intensity/1.25));
      const i=(y*w+x)*4;
      pixels.data[i]=255;pixels.data[i+1]=170+Math.round(value*66);pixels.data[i+2]=14+Math.round(value*39);pixels.data[i+3]=255;
    }
    context.putImageData(pixels,0,0);
  }
  render(0);
  return {render,dispose(){canvas.remove();}};
}
function chatusSceneMarkup(){
  const logo=atob(CHATUS_ASSETS.logo.split(',')[1]),heart=atob(CHATUS_ASSETS.heart.split(',')[1]);
  return '<svg class="clip-definitions" aria-hidden="true"><defs><clipPath id="counterClip" clipPathUnits="userSpaceOnUse"><path id="aperturePath" d="'+CHATUS_GEOMETRY.apertureD+'"/></clipPath></defs></svg>'+
    '<div class="final-background" id="finalBackground"><div class="luma-host" id="lumaHost"></div><div class="warm-wash" id="warmWash"></div></div>'+
    '<div class="scene-canvas design-canvas" id="designCanvas"><svg class="ray-field" id="rayField" viewBox="0 0 402 874" aria-hidden="true"><defs><linearGradient id="rayLight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffac22" stop-opacity="0"/><stop offset="0.36" stop-color="#ffc64b" stop-opacity="0.7"/><stop offset="0.74" stop-color="#fff2b8"/><stop offset="1" stop-color="#f7a335" stop-opacity="0"/></linearGradient><filter id="raySoftness" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.5"/></filter></defs>'+Array.from({length:20},()=>'<path/>').join('')+'</svg><div class="light-bloom" id="lightBloom"></div><div class="camera" id="camera">'+
    '<div class="scene-logo" role="img" aria-label="Chatus">'+logo+'<div id="shineMask" aria-hidden="true"><div id="shineBand"><div id="shineCore"></div><div id="shineTrail"></div></div></div></div>'+
    '<div id="heartAnchor"><div id="heartMotion" role="img" aria-label="Розовое сердце">'+heart+'</div></div></div>'+
    Array.from({length:6},()=>'<div class="letter-echo" aria-hidden="true"><svg viewBox="0 0 180 180"><path d="'+CHATUS_GEOMETRY.letterD+'" fill="#2a1b00"/></svg></div>').join('')+'</div>';
}
function mountChatusScene(host, renderBackground=true){
  host.innerHTML=chatusSceneMarkup();
  const get=id=>host.querySelector('#'+id);
  const elements=Object.fromEntries(['shineMask','shineBand','shineCore','shineTrail','heartAnchor','heartMotion','camera','finalBackground','aperturePath','warmWash','lumaHost','rayField','lightBloom'].map(id=>[id,get(id)]));
  elements.echoes=Array.from(host.querySelectorAll('.letter-echo'));
  elements.rays=Array.from(elements.rayField.querySelectorAll('path'));
  elements.viewport={scale:1,x:0,y:0,width:402,height:874};
  if(renderBackground)elements.luma=createLumaRenderer(elements.lumaHost,LUMA_SETTINGS);
  elements.shineMask.style.maskImage='url("'+CHATUS_ASSETS.logo+'")';
  elements.shineMask.style.webkitMaskImage='url("'+CHATUS_ASSETS.logo+'")';
  return elements;
}
function createChatusMotion(elements) {
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const curves = {
    silk: [0.4, 0, 0.6, 1],
    portal: [0.55, 0, 0.4, 1],
    pop: [0.22, 0, 0.14, 1],
    linear: [0, 0, 1, 1],
    smooth: [0.42, 0, 0.58, 1],
    soft: [0.25, 0.1, 0.25, 1],
    out: [0.16, 1, 0.3, 1],
    in: [0.55, 0.055, 0.675, 0.19]
  };
  // Zero velocity and acceleration at both ends. Used for light opacity
  // and the heart's one-way settle, so no extra bounce is introduced.
  const smoother = p => { p = clamp(p); return p * p * p * (p * (p * 6 - 15) + 10); };
  function ease(p, name) {
    p = clamp(p);
    if (p === 0 || p === 1 || name === 'linear') return p;
    const [x1, y1, x2, y2] = curves[name] || curves.smooth;
    const bezier = (t, a, b) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t * t * b + t ** 3;
    let lo = 0, hi = 1;
    for (let i = 0; i < 22; i++) {
      const t = (lo + hi) / 2;
      if (bezier(t, x1, x2) < p) lo = t; else hi = t;
    }
    return bezier((lo + hi) / 2, y1, y2);
  }
  function stateAt(time, c) {
    const t = clamp(time, 0, c.total);
    const usesLuma=['luma','twist','circle','rays'].includes(c.variant);
    const skipIntro=c.variant==='circle'&&c.skipIntro;
    const shineStart = c.initialDelay + c.shineDelay;
    const heartStart = Number.isFinite(c.shineHeartGap)
      ? Math.max(c.initialDelay, shineStart + c.shineDuration + c.shineHeartGap)
      : c.initialDelay + c.heartDelay;
    const shineProgress = clamp((t - shineStart) / c.shineDuration);
    const heartProgress = clamp((t - heartStart) / c.heartDuration);
    const shineActive = t > shineStart && t < shineStart + c.shineDuration;
    // Retiming is symmetric and monotonic: a little more speed in the middle,
    // without changing the selected easing or the endpoints.
    const acceleration = clamp(c.shineAcceleration ?? 0);
    const travel = shineProgress + (smoother(shineProgress) - shineProgress) * acceleration;
    const distance = c.shineStart + (c.shineEnd - c.shineStart) * ease(travel, c.shineEasing);
    let fadeIn = Math.max(0, c.shineFadeIn ?? 0), fadeOut = Math.max(0, c.shineFadeOut ?? 0);
    const fadeFit = Math.min(1, c.shineDuration / Math.max(1, fadeIn + fadeOut));
    fadeIn *= fadeFit; fadeOut *= fadeFit;
    const shineElapsed = t - shineStart;
    const lightEnvelope = (fadeIn ? smoother(shineElapsed / fadeIn) : 1)
      * (fadeOut ? smoother((c.shineDuration - shineElapsed) / fadeOut) : 1);
    const settle = clamp(c.heartSettleDuration ?? c.heartDuration * 0.6, 0, c.heartDuration * 0.9);
    const rise = c.heartDuration - settle;
    const heartElapsed = Math.max(0, t - heartStart);
    // With no settle interval there is no overshoot to snap back from.
    const overshoot = settle > 0 ? c.overshoot : 0;
    let pop;
    if (heartProgress <= 0) pop = 0;
    else if (heartProgress >= 1) pop = 1;
    else if (heartElapsed < rise) pop = (1 + overshoot) * ease(heartElapsed / rise, c.heartEasing);
    else pop = 1 + overshoot * (1 - smoother((heartElapsed - rise) / settle));
    const bounce = -c.bounce * Math.sin(heartProgress * Math.PI) ** 4;
    const overlap=['twist','circle','rays'].includes(c.variant)?c.transitionOverlap:0;
    const transitionStart=skipIntro?Math.max(0,c.initialDelay+c.transitionDelay):Math.max(shineStart+c.shineDuration,heartStart+rise,heartStart+c.heartDuration+c.transitionDelay-overlap);
    const elapsed=t-transitionStart;
    const transitionProgress=clamp(elapsed/c.transitionDuration);
    const boundary=CHATUS_GEOMETRY.aperturePolygon;
    let radius=Infinity;
    for(let i=0;i<boundary.length;i++){
      const a=boundary[i],b=boundary[(i+1)%boundary.length],dx=b[0]-a[0],dy=b[1]-a[1];
      const p=clamp(((c.entryX-a[0])*dx+(c.entryY-a[1])*dy)/(dx*dx+dy*dy||1));
      radius=Math.min(radius,Math.hypot(c.entryX-a[0]-p*dx,c.entryY-a[1]-p*dy));
    }
    const viewport=elements.viewport||{scale:1,x:0,y:0,width:402,height:874};
    const coverZoom=Math.hypot(viewport.width/2,viewport.height/2)/viewport.scale/Math.max(0.05,radius*0.9);
    const cameraAt=(p)=>{
      const travel=ease(p,c.transitionEasing);
      // The knob controls approach strength. Complete the passage at the end
      // even at low zoom settings, so no uncovered edge flashes into the final frame.
      const scale=Math.exp(Math.log(Math.max(1,c.zoom))*travel+Math.log(Math.max(1,coverZoom/c.zoom))*smoother((p-0.6)/0.4));
      const entryX=111+c.entryX,entryY=347+c.entryY;
      const pan=smoother(p);
      const angle=c.variant==='twist'?c.twistAngle*smoother((p*c.transitionDuration-c.twistStart)/Math.max(1,c.twistDuration)):0;
      const radians=angle*Math.PI/180,a=scale*Math.cos(radians),b=scale*Math.sin(radians);
      // Rotate around the actual counter, while its center approaches the screen center.
      return {scale,angle,a,b,x:entryX-a*entryX+b*entryY+(201-entryX)*pan,y:entryY-b*entryX-a*entryY+(437-entryY)*pan};
    };
    const camera=cameraAt(transitionProgress);
    const copies=Array.from({length:Math.round(c.copies)},(_,i)=>{
      const offset=Math.min(c.copyStagger*(i+1),c.transitionDuration*0.7);
      const p=clamp((elapsed-offset)/(c.transitionDuration-offset));
      return {...cameraAt(p),progress:p,opacity:['circle','rays'].includes(c.variant)||p>=1?0:smoother(p/0.15)*(1-smoother((p-0.84)/0.16))*(c.variant==='light'?0.38:usesLuma?0.14:0.65)};
    });
    let reveal=smoother(elapsed/Math.min(c.revealDuration,c.transitionDuration));
    const circleDuration=Math.min(c.circleDuration,c.transitionDuration),circleProgress=clamp(elapsed/circleDuration);
    const cx=viewport.x+viewport.scale*c.circleX,cy=viewport.y+viewport.scale*c.circleY;
    const coverRadius=Math.max(...[0,viewport.width].flatMap(x=>[0,viewport.height].map(y=>Math.hypot(x-cx,y-cy))))+2;
    const initialRadius=Math.min(coverRadius,c.circleRadius*viewport.scale);
    const circleRadius=initialRadius*smoother(circleProgress/0.18)+(coverRadius-initialRadius)*ease(circleProgress,c.transitionEasing);
    const riseTime=Math.min(c.lightRiseDuration,c.transitionDuration*0.6);
    const fadeTime=Math.min(c.lightFadeDuration,c.transitionDuration-riseTime);
    const release=Math.max(riseTime,c.transitionDuration-fadeTime);
    const rayEnvelope=smoother(elapsed/Math.max(1,riseTime))*(1-smoother((elapsed-release)/Math.max(1,fadeTime)));
    const fadeStart=c.variant==='rays'?Math.max(0,riseTime-c.transitionOverlap):0;
    const logoOpacity=elapsed<=fadeStart?1:1-smoother((elapsed-fadeStart)/Math.max(1,Math.min(c.logoFadeDuration,c.transitionDuration-fadeStart)));
    if(c.variant==='circle')reveal=elapsed>0?1:0;
    if(c.variant==='rays')reveal=ease((elapsed-riseTime*0.55)/Math.max(1,Math.min(c.revealDuration,c.transitionDuration-riseTime*0.55)),c.transitionEasing);
    return {
      time: t, shineStart, heartStart, shineProgress, heartProgress, heartRiseDuration: rise,
      transitionStart,transitionProgress,camera,copies,reveal,usesLuma,circleProgress,circleRadius,circleX:cx,circleY:cy,rayEnvelope,
      cameraOpacity:transitionProgress>=1?0:['circle','rays'].includes(c.variant)?logoOpacity:1-smoother((transitionProgress-0.9)/0.1),
      warmOpacity:c.variant==='light'&&transitionProgress<1?Math.sin(Math.PI*transitionProgress)**4*c.echoIntensity*0.55:0,
      shineVisible: !skipIntro&&shineActive ? c.shineOpacity * lightEnvelope : 0,
      shineX: distance,
      heartScale: pop * c.heartScale,
      heartOpacity: skipIntro?0:c.heartOpacity * smoother(heartProgress / 0.28),
      heartY: bounce,
      phase: transitionProgress>=1||(c.variant==='circle'&&circleProgress>=1&&logoOpacity===0) ? (usesLuma?'Готово · живой фон Luma':'Готово · пустой тёмный фон') : transitionProgress>0 ? ({depth:'Глубина буквы',light:'Тёплый световой проход',luma:'Раскрытие Luma',twist:'Погружение с поворотом',circle:'Круговое раскрытие',rays:'Световые лучи → Luma'}[c.variant]) : !skipIntro&&heartProgress > 0 && shineActive ? 'Блик → сердце' : !skipIntro&&heartProgress > 0 ? 'Появление сердца' : !skipIntro&&shineActive ? 'Световой блик' : 'Логотип уже виден'
    };
  }
  function render(time, c, backgroundTime=time) {
    const s = stateAt(time, c);
    // Exact Figma layers 2228:10676 / 2228:10678. Their transforms include
    // skew, not just rotation: a white/grey trailing strip follows a gold radial fill.
    const sourceWidth = 35.395347595214844;
    const matrix = 'matrix(0.9954712986946106,0.0950617790222168,-0.7986166477203369,0.6018400192260742,0,0)';
    const shift = (sourceWidth - c.shineWidth) / 2;
    elements.shineMask.style.opacity = s.shineVisible;
    elements.shineBand.style.filter = 'blur(' + c.shineBlur + 'px)';
    elements.shineBand.style.transform = 'translateX(' + s.shineX + 'px) rotate(' + (-(c.shineAngle + 5.4548759967688705)) + 'deg)';
    elements.shineCore.style.left = (84.7854232788086 + shift * 0.9954712986946106) + 'px';
    elements.shineCore.style.top = (61.77197265625 + shift * 0.0950617790222168) + 'px';
    elements.shineCore.style.width = c.shineWidth + 'px';
    elements.shineCore.style.transform = matrix;
    elements.shineCore.style.background = 'radial-gradient(ellipse 50% 50% at 50% 50%, ' + c.shineColor + ' 0%, #f2f4f7 100%)';
    elements.shineTrail.style.left = (125.15237426757812 - shift * 0.9954712986946106) + 'px';
    elements.shineTrail.style.top = (61.29866886138916 - shift * 0.0950617790222168) + 'px';
    elements.shineTrail.style.width = (c.shineWidth * 12.635333061218262 / sourceWidth) + 'px';
    elements.shineTrail.style.transform = matrix;
    elements.heartAnchor.style.left = (284.12 + c.heartX) + 'px';
    elements.heartAnchor.style.top = (421.06 + c.heartY) + 'px';
    elements.heartMotion.style.opacity = s.heartOpacity;
    elements.heartMotion.style.transform = 'translateY(' + s.heartY + 'px) scale(' + s.heartScale + ')';
    if(elements.camera){
      const transform=v=>'matrix('+v.a+','+v.b+','+(-v.b)+','+v.a+','+v.x+','+v.y+')';
      elements.camera.style.transform=['circle','rays'].includes(c.variant)?'none':transform(s.camera);
      elements.camera.style.opacity=s.cameraOpacity;
      const mix=(a,b,p)=>{
        const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
        const x=rgb(a),y=rgb(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*clamp(p)).toString(16).padStart(2,'0')).join('');
      };
      const warm=p=>p<0.5?mix(c.amber,c.orange,p*2):mix(c.orange,c.copper,(p-0.5)*2);
      elements.echoes.forEach((el,i)=>{
        const echo=s.copies[i];el.style.opacity=echo?echo.opacity:0;
        if(!echo)return;
        el.style.transform=transform(echo);
        const amount=c.variant==='depth'?c.echoIntensity*0.3:c.echoIntensity;
        el.querySelector('path').setAttribute('fill',mix('#2a1b00',warm(clamp(echo.progress+i*0.1)),amount));
      });
      const v=elements.viewport,a=v.scale*s.camera.a,b=v.scale*s.camera.b;
      elements.aperturePath.setAttribute('transform','matrix('+a+','+b+','+(-b)+','+a+','+(v.x+v.scale*s.camera.x+111*a-347*b)+','+(v.y+v.scale*s.camera.y+111*b+347*a)+')');
      elements.finalBackground.style.clipPath=c.variant==='circle'?(s.circleProgress>=1?'none':'circle('+s.circleRadius+'px at '+s.circleX+'px '+s.circleY+'px)'):c.variant==='rays'||s.transitionProgress>=1?'none':'url(#counterClip)';
      elements.finalBackground.style.opacity=s.reveal;
      elements.finalBackground.style.background=c.endColor;
      elements.lumaHost.style.opacity=s.usesLuma?1:0;
      elements.warmWash.style.background=warm(s.transitionProgress);
      elements.warmWash.style.opacity=s.warmOpacity;
      if(elements.rayField){
        const rays=c.variant==='rays';
        elements.rayField.style.opacity=rays?s.rayEnvelope*c.rayIntensity:0;
        elements.lightBloom.style.background='radial-gradient(ellipse at 50% 50%,#fff1b4 0%,'+c.amber+'55 28%,'+c.orange+'00 68%)';
        elements.lightBloom.style.opacity=rays?s.rayEnvelope*c.rayIntensity*0.24:0;
        const stops=elements.rayField.querySelectorAll('stop');
        [c.copper,c.orange,'#fff2b8',c.amber].forEach((color,i)=>stops[i]?.setAttribute('stop-color',color));
        elements.rays.forEach((ray,i)=>{
          const active=rays&&i<Math.round(c.rayCount);
          ray.style.opacity=active?(0.35+0.6*((i*7%11)/10))*smoother((time-s.transitionStart-i*9)/Math.max(1,c.lightRiseDuration)):0;
          if(!active)return;
          // Uneven directed shafts, with distinct widths and depth. No radial sunburst.
          const offset=(i-(c.rayCount-1)/2)*22+Math.sin(i*2.1)*18+(i%2?1:-1)*smoother(s.transitionProgress)*28;
          const width=c.rayWidth*(0.5+(i*5%7)/6)*(0.7+0.7*s.transitionProgress);
          const angle=(c.rayDirection+(i*13%17-8)*(0.75+0.25*s.transitionProgress))*Math.PI/180;
          const sourceX=201+offset*0.45,sourceY=437+Math.cos(i*1.9)*50;
          const direction=i%4===0?1:-1,farX=sourceX+Math.sin(angle)*1100*direction,farY=sourceY+Math.cos(angle)*1100*direction;
          const dx=Math.cos(angle)*width,dy=-Math.sin(angle)*width;
          ray.setAttribute('d','M '+(sourceX-dx*0.2)+' '+(sourceY-dy*0.2)+' L '+(farX-dx)+' '+(farY-dy)+' L '+(farX+dx)+' '+(farY+dy)+' L '+(sourceX+dx*0.2)+' '+(sourceY+dy*0.2)+' Z');
        });
      }
      if(s.usesLuma)elements.luma?.render(backgroundTime);
    }
    return s;
  }
  return { stateAt, render };
}
const config = {
  "total": 2955,
  "initialDelay": 200,
  "speed": 1,
  "shineDelay": 160,
  "shineDuration": 700,
  "shineAcceleration": 0.25,
  "shineFadeIn": 100,
  "shineFadeOut": 170,
  "shineWidth": 35.395347595214844,
  "shineBlur": 0,
  "shineOpacity": 1,
  "shineAngle": -5.4548759967688705,
  "shineColor": "#fdab1b",
  "shineStart": -150,
  "shineEnd": 150,
  "shineEasing": "silk",
  "shineHeartGap": -20,
  "heartDelay": 840,
  "heartDuration": 542,
  "heartSettleDuration": 335,
  "heartScale": 1,
  "overshoot": 0.13,
  "bounce": 0.95,
  "heartOpacity": 1,
  "heartX": 0,
  "heartY": 0,
  "heartEasing": "pop",
  "variant": "circle",
  "transitionDelay": 333,
  "transitionDuration": 900,
  "entryX": 82.1,
  "entryY": 97.55,
  "zoom": 520,
  "copies": 4,
  "copyStagger": 80,
  "echoIntensity": 0.65,
  "amber": "#d6a052",
  "orange": "#ea8b35",
  "copper": "#a05b3d",
  "transitionEasing": "portal",
  "revealDuration": 480,
  "endColor": "#111116",
  "transitionOverlap": 80,
  "twistAngle": 14,
  "twistStart": 360,
  "twistDuration": 380,
  "circleX": 201,
  "circleY": 437,
  "circleRadius": 0,
  "circleDuration": 460,
  "logoFadeDuration": 200,
  "skipIntro": false,
  "rayCount": 11,
  "rayWidth": 14,
  "rayDirection": -14,
  "rayIntensity": 0.85,
  "lightRiseDuration": 260,
  "lightFadeDuration": 430
};


export function mountSplash(splash, welcome, onComplete) {
  // Preserve the exported logo timing; the portal reveals the real destination.
  // The playground's yellow Luma renderer is intentionally not mounted here.
  const scene=mountChatusScene(splash,false), motion=createChatusMotion(scene);
  const canvas=splash.querySelector('#designCanvas');
  let time=0,backgroundTime=0,frameId=0,previous=0,disposed=false,completed=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function render(){
    const state=motion.render(time,config,backgroundTime);
    welcome.style.clipPath=state.circleProgress>=1?'none':
      'circle('+state.circleRadius+'px at '+state.circleX+'px '+state.circleY+'px)';
  }
  function fit(){
    const scale=Math.min(splash.clientWidth/402,splash.clientHeight/874);
    const x=(splash.clientWidth-402*scale)/2,y=(splash.clientHeight-874*scale)/2;
    scene.viewport={scale,x,y,width:splash.clientWidth,height:splash.clientHeight};
    canvas.style.transform='translate('+x+'px,'+y+'px) scale('+scale+')';render();
  }
  function tick(now){
    if(disposed||document.hidden)return;
    const delta=previous?Math.min(48,now-previous)*config.speed:0;previous=now;
    time=Math.min(config.total,time+delta);backgroundTime+=delta;render();
    if(time>=config.total&&!completed){completed=true;onComplete();}
    frameId=requestAnimationFrame(tick);
  }
  const observer=new ResizeObserver(fit);observer.observe(splash);fit();
  let reducedTimer;
  if(reduced.matches)reducedTimer=setTimeout(()=>{welcome.style.clipPath='none';onComplete();},350);
  else frameId=requestAnimationFrame(tick);
  function visibility(){
    cancelAnimationFrame(frameId);previous=0;
    if(!document.hidden&&!reduced.matches)frameId=requestAnimationFrame(tick);
  }
  document.addEventListener('visibilitychange',visibility);
  return ()=>{disposed=true;cancelAnimationFrame(frameId);clearTimeout(reducedTimer);observer.disconnect();document.removeEventListener('visibilitychange',visibility);scene.luma?.dispose();splash.replaceChildren();};
}
