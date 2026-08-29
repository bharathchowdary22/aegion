import sys
import asyncio
import pytest

@pytest.fixture(scope="session")
def event_loop():
    """
    Override the default event loop to use WindowsSelectorEventLoopPolicy on Windows.
    This prevents the 'AttributeError: 'NoneType' object has no attribute 'send'' error
    during ProactorEventLoop teardown with asyncpg sockets.
    """
    if sys.platform.startswith("win"):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
