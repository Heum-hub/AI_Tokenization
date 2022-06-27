// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import '@chainlink/contracts/src/v0.8/ChainlinkClient.sol';
import '@chainlink/contracts/src/v0.8/ConfirmedOwner.sol';

contract ModelTokenFactory is ChainlinkClient, ConfirmedOwner, Ownable {
    // 체인링크 데이터 오라클 사용
    using Chainlink for Chainlink.Request;

    uint256 public accuracy;
    bytes32 private jobId;
    uint256 private fee;

    // AI model 토큰
    IERC20 public modelToken;

    // AI model의 개발자
    address public developer;

    // 거래 시 동시성 문제 처리(스왑 메서드에 붙임)
    uint private unlocked = 1;
    modifier lock() {
        require(unlocked == 1, 'LOCKED');
        unlocked = 0;
        _;
        unlocked = 1;
    }

    /*
    AI model의 개발자가 컨트랙트를 배포하게 된다
    배포할 때 AI model 토큰의 이름, 심볼, 발행량을 결정하게 된다
    체인링크 오라클을 초기화
    */
    constructor(string memory name, string memory symbol, uint256 totalSupply) ConfirmedOwner(msg.sender) {
        modelToken = new ERC20(name, symbol, totalSupply * 10 ** 18);
        developer = msg.sender;
        
        setChainlinkToken(0x01BE23585060835E02B77ef475b0Cc51aA1e0709);
        setChainlinkOracle(0xf3FBB7f3391F62C8fe53f89B41dFC8159EE9653f);
        jobId = 'ca98366cc7314957b8c012c72f05aeeb';
        fee = (1 * LINK_DIVISIBILITY) / 10; // 0,1 * 10**18 (Varies by network and job);
        
        modelToken.mint(address(this), totalSupply);
    }

    /*
    이 컨트랙트 자체가 코인(이더리움)을 보유할 수 있도록 함
    페어 예치를 통해 AI model 토큰이 가치를 갖게 됨(유동화)
    */
    receive() external payable {}

    // 이더리움으로 AI model 토큰을 구매
    function swapEthToModel() external payable lock {

        uint256 k = address(this).balance * modelToken.balanceOf(address(this));
        
        uint256 ethAmount = msg.value;
        require(ethAmount > 0, "Amount must be >0");

        uint256 modelTokenAmount = modelToken.balanceOf(address(this)) - k/(address(this).balance + ethAmount);

        modelToken.transfer(msg.sender, modelTokenAmount);
 
    }

    // AI model 토큰으로 이더리움을 구매
    function swapModelToEth(uint256 modelTokenAmount) external lock {

        uint256 k = address(this).balance * modelToken.balanceOf(address(this));
        
        require(modelTokenAmount > 0, "Amount must be >0");

        uint256 ethAmount = address(this).balance - k/(modelToken.balanceOf(address(this)) + modelTokenAmount);

        modelToken.transferFrom(msg.sender, address(this), modelTokenAmount);

        payable(msg.sender).transfer(ethAmount);
 
    }
    
    // 오라클을 사용하여 학습 서버에 정확도 요청하여 블록체인에 기록
    /**
     * Create a Chainlink request to retrieve API response, find the target
     * data, then multiply by 1000000000000000000 (to remove decimal places from data).
     */
    function requestAccuracyData() public returns (bytes32 requestId) {
        Chainlink.Request memory req = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);

        // Set the URL to perform the GET request on
        req.add('get', 'URL');
        // Set path for json
        req.add('path', 'Accuracy'); // Chainlink nodes 1.0.0 and later support this format

        // Multiply the result by 1000000000000000000 to remove decimals
        int256 timesAmount = 10**18;
        req.addInt('times', timesAmount);

        // Sends the request
        return sendChainlinkRequest(req, fee);
    }

    /**
     * Receive the response in the form of uint256
     */
    function fulfill(bytes32 _requestId, uint256 _accuracy) public recordChainlinkFulfillment(_requestId) {
        accuracy = _accuracy;
    }

    /**
     * Allow withdraw of Link tokens from the contract
     */
    function withdrawLink() public onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
        require(link.transfer(msg.sender, link.balanceOf(address(this))), 'Unable to transfer');
    }
    
    // AI model 토큰의 가격을 보여주는 메서드(단위: ETH)
    function getModelTokenPrice() external view returns (uint256 modelTokenPrice) {

        modelTokenPrice = address(this).balance / modelToken.balanceOf(address(this));

        return modelTokenPrice;

    }

    /* 
    developer가 공급한 유동성을 회수할 수 있게 하는 메서드
    현재는 developer만이 유동성을 공급하는 상황으로 가정(지분 100%)
    */
    function withdrawLiqutidity() external {
        
        require(msg.sender == developer, "Only dev allowed");

        // 이더리움 출금
        payable(developer).transfer(address(this).balance);
        // AI Model 토큰 출금
        modelToken.transfer(developer, modelToken.balanceOf(address(this)));
    
    }

}
