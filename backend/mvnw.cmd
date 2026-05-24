@REM ----------------------------------------------------------------------------
@REM Maven Start Up Batch script (generated for Spring Boot project)
@REM ----------------------------------------------------------------------------
@IF "%__MVNW_ARG0_NAME__%"=="" (SET "MVNW_ARG0_NAME=%~nx0")
@SET ENV_VAR=JAVA_HOME
@SET JAVA_EXE=java.exe
@IF NOT "%JAVA_HOME%"=="" GOTO OkJHome
@FOR %%i IN (%JAVA_EXE%) DO SET JAVA_EXE=%%~$PATH:i
@IF NOT "%JAVA_EXE%"=="" GOTO OkJHome
@ECHO Error: JAVA_HOME not found. Please set the JAVA_HOME variable.
@GOTO error
:OkJHome
@SET JAVA_EXE=%JAVA_HOME%\bin\java.exe

@SET WRAPPER_JAR="%~dp0.mvn\wrapper\maven-wrapper.jar"
@SET WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain
@SET DOWNLOAD_URL="https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar"

@IF EXIST %WRAPPER_JAR% (
    "%JAVA_EXE%" -cp %WRAPPER_JAR% %WRAPPER_LAUNCHER% %*
) ELSE (
    @echo Downloading Maven Wrapper...
    @"%JAVA_EXE%" -Xms64m -Xmx128m ^
        -classpath "%JAVA_HOME%\lib\*.jar" ^
        -jar %WRAPPER_JAR% %*
    @IF ERRORLEVEL 1 (
        @echo Failed to execute Maven Wrapper. Download it manually:
        @echo   %DOWNLOAD_URL%
        @GOTO error
    )
)
@GOTO end
:error
@SET ERROR_CODE=1
:end
@CMD /C EXIT /B %ERROR_CODE%
