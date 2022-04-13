// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IERC20.sol";
import "./ERC20.sol";

contract ModelTokenFactory {

    // AI model 토큰
    IERC20 public modelToken;

    // AI model의 개발자
    address private developer;

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
    */
    constructor(string memory name, string memory symbol, uint256 totalSupply) {
        modelToken = new ERC20(name, symbol, totalSupply);
        developer = msg.sender;
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
    
    // AI model 토큰의 가격을 보여주는 메서드(단위: ETH)
    function getModelTokenPrice() public view returns (uint256 modelTokenPrice) {

        modelTokenPrice = modelToken.balanceOf(address(this)) / address(this).balance;

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