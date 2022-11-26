# Steps after deploying:

1. call function `premint` on *NightCatsGenesis*. totalSupply() will now be 33.
2. check that it is looking correctly. If you want unrevealed image to change, call `setBaseStateUri`
3. call function `setIsWlMintLive` with `true` on *NightCatsGenesis*
4. now users can mint via `mint` function. If user mint is complete (i.e. totalSupply() is 300), skip to 4. Otherwise:
    1. call function `setIsOpenMintLive` with `true` on *NightCatsGenesis* & wait for users to mint out.
5. after minting, if you want to do a reveal, call `setBaseStateUri`
6. 