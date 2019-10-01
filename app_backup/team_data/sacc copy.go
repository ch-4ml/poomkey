/*
 * Copyright IBM Corp All Rights Reserved
 *
 * SPDX-License-Identifier: Apache-2.0
 */

package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

// 체인코드에서 발생되는 모든 데이터가 저장되는 공간
type SimpleAsset struct {
}

// 키 구조체 (World State에 담기는 정보)
type Key struct {
	ObjectType	 string `json:"docType"` 		// 카우치 DB의 인덱스 기능을 쓰기위한 파라미터, 이 오브젝트 타입에 만든 구조체 이름을 넣으면 인덱스를 찾을 수 있음
	PoomId	 	 string `json:"poomId"` 		// 제품 키 식별값
	PoomKey   	 string `json:"poomKey"` 		// 제품 키 
	PoomName  	 string `json:"poomName"` 		// 제품 이름
	PoomOwner	 string `json:"poomOwner"` 		// 제품 키 소유자
	PoomValidity string `json:"poomValidity"` 	// 제품 키 사용 가능 기간
}
 
// 초기화 함수
func (t *SimpleAsset) Init(stub shim.ChaincodeStubInterface) peer.Response {
	// nil = null을 의미한다. 이는 0으로 초기화 되어 있거나 한 것이 아닌 진짜 비어있는 값이다.
	return shim.Success(nil)
}
 
// 호출할 함수를 식별하는 함수
func (t *SimpleAsset) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	// 함수 이름과, args를 분리하여 저장한다.
	fn, args := stub.GetFunctionAndParameters()

	var result string
	var err error
	if fn == "setKey" {
		result, err = set(stub, args)
	} else if fn == "getKeysById" {
		result, err = getKeys(stub) {
	} else if fn == "getKeysByOwner" {
		result, err = getKeysByOwner(stub, args)
	} else if fn == "changeKeyOwner" {
		result, err = changeKeyOwner(stub, args)
	} else {
		return shim.Error("Not supported chaincode function.")
	}
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte(result))
}
 

// 
func (t *Key) setKey(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) != 5 {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key and a value")
	}

	// JSON  변환
	var poomKey = Key{ObjectType: "Key", PoomId: args[0], PoomKey: args[1], PoomName: args[2], PoomOwner: args[3], PoomValidity: args[4]}
	poomKeyAsBytes, _ := json.Marshal(poomKey)

	err := stub.PutState(args[0], poomKeyAsBytes)
	if err != nil {
		return "", fmt.Errorf("Failed to set asset: %s", args[0])
	}

	indexName := "owner~id"
	ownerIdIndexKey, err := stub.CreateCompositeKey(indexName, []string{poomKey.PoomOwner, poomKey.PoomIndex})
	if err != nil {
		return shim.Error(err.Error())
	}
	// value 에 비어있는 바이트 배열 생성
	value := []byte{0x00}
	
	stub.PutState(ownerIdIndexKey, value)

	return string(poomKeyAsBytes), nil
}

func (t *Key) getKeysById(stub shim.ChaincodeStubInterface) (string, error) {

	iter, err := stub.GetStateByRange("0", "9")
	if err != nil {
		return "", fmt.Errorf("Failed to get all keys with error: %s", err)
	}
	defer iter.Close()

	var buffer string
	buffer = "["

	comma := false
	for iter.HasNext() {
		res, err := iter.Next()
		if err != nil {
			return "", fmt.Errorf("%s", err)
		}
		if comma == true {
			buffer += ","
		}
		buffer += string(res.Value)

		comma = true
	}
	buffer += "]"

	fmt.Println(buffer)

	return string(buffer), nil
}

func (t *Key) getKeysByOwner(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) != 1 {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key")
	}
	owner := args[0]
	queriedKeysByOwnerIterator, err := stub.GetStateByPartialCompositeKey("owner~id", []string{owner})
	if err != nil {
		return "", fmt.Errorf("...")
	}
	defer queriedKeysByOwnerIterator.Close()
	
	var buffer string
	buffer = "["

	comma := false
	for queriedKeysByOwnerIterator.HasNext() {
		res, err := queriedKeysByOwnerIterator.Next()
		if err != nil {
			return "", fmt.Errorf("%s", err)
		}
		if comma == true {
			buffer += ","
		}
		buffer += string(res.Value)

		comma = true
	}
	buffer += "]"

	fmt.Println(buffer)
	
	return string(buffer), nil
}

// transfer 하면 index도 알아서 변경될까?
func (t *Key) changeKeyOwner(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if (len(args) != 3) {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key")
	}
	poomKeyId := args[0]
	owner := args[1]
	newOwner := args[2]
	queriedKeysByOwnerIterator, err := stub.GetStateByPartialCompositeKey("owner~id", []string{owner})
	if err != nil {
		return "", fmt.Errorf("...")
	}
	defer queriedKeysByOwnerIterator.Close()
	
	flag := false
	for queriedKeysByOwnerIterator.HasNext() {
		res, err := queriedKeysByOwnerIterator.Next()
		if err != nil {
			return "", fmt.Errorf("%s", err)
		}
		objectType, compositeKeyParts, err := stub.SplitCompositeKey(res.Key)
		if err != nil {
			return "", fmt.Errorf("%s", err)
		}
		returnedOwner := compositeKeyParts[0]
		returnedId := compositeKeyParts[1]

		if returnedId == poomKeyId {
			flag = true
			break
		}
	}

	if !flag {
		return "내 키 아닌디", fmt.Errorf("내 키가 아니여")
	}

	keyAsBytes, err := stub.GetState(poomKeyId)
	if err != nil {
		return "", fmt.Errorf("%s", err)
	} else if keyAsBytes == nil {
		return "", fmt.Errorf("Key does not exist")
	}

	keyToTransfer := Key{}
	err = json.Unmarshal(keyAsBytes, &keyToTransfer)
	if err != nil {
		return "", fmt.Errorf("%s", err)
	}
	keyToTransfer.PoomOwner = newOwner
	keyJSONasBytes, _ := json.Marshal(keyToTransfer)
	err = stub.PutState(poomKeyId, keyJSONasBytes)
	if err != nil {
		return "", fmt.Errorf("%s", err)
	}
	return shim.Success(nil)
}

func main() {
	if err := shim.Start(new(SimpleAsset)); err != nil {
		fmt.Printf("Error starting SimpleAsset chaincode: %s", err)
	}
}