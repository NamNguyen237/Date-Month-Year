@echo off
chcp 65001
set /a continue=1

:run
run2.exe

echo Tiếp tục?
set /p contprompt=Nhập 0 hoặc bỏ trống để kết thúc, 1 để tiếp tục:
if %continue% EQU %contprompt% (
    goto :run
)
