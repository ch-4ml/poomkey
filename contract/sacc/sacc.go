/*
 * Copyright IBM Corp All Rights Reserved
 *
 * SPDX-License-Identifier: Apache-2.0
 */

package main

import (
	"encoding/json"
	"fmt"
	"bytes"
	"time"
	"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

// 체인코드에서 발생되는 모든 데이터가 저장되는 공간
type SimpleAsset struct {
}

// 키 구조체 (World State에 담기는 정보)
type Key struct {
	ObjectType	 string `json:"docType"` // 카우치 DB의 인덱스 기능을 쓰기위한 파라미터, 이 오브젝트 타입에 만든 구조체 이름을 넣으면 인덱스를 찾을 수 있음
	PoomId	 	 string `json:"poomId"` // 제품키 식별값
	PoomKey   	 string `json:"poomKey"` // 제품키 
	PoomName  	 string `json:"poomName"` // 제품 이름
	PoomOwner	 string `json:"poomOwner"` // 제품키 소유자
	PoomValidity string `json:"poomValidity"` // 제품키 사용 가능 기간
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
		result, err = setKey(stub, args)
	} else if fn == "getAllKeys" {
		result, err = getAllKeys(stub) 
	} else if fn == "getKeysByOwner" {
		result, err = getKeysByOwner(stub, args)
	} else if fn == "changeKeyOwner" {
		result, err = changeKeyOwner(stub, args)
	} else if fn == "getHistoryByKey" {
		result, err = getHistoryByKey(stub, args)
	} else {
		return shim.Error("Not supported chaincode function.")
	}
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte(result))
}
 
func setKey(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) != 5 {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key and a value")
	}

	// JSON  변환
	var poomKey = Key{ObjectType: "Key", PoomId: args[0], PoomKey: args[1], PoomName: args[2], PoomOwner: args[3], PoomValidity: args[4]}
	poomKeyAsBytes, _ := json.Marshal(poomKey)
	// poomKeyAsBytes2, _ := json.Marshal(poomKey) 값이 사라지는것도 아님...
	// poomKeyJSON := `{"docType": "Key", "PoomId":`+ args[0] +`", PoomKey":`+ args[1] + `", PoomName":`+ args[2] + `", PoomOwner":`+args[3]+ `", PoomValidity":` + args[4] + `}`
	// poomKeyJSONasBytes := []byte(str)

	err := stub.PutState(args[0], poomKeyAsBytes)
	if err != nil {
		return "", fmt.Errorf("Failed to set asset: %s", args[0])
	}
	
	indexName := "owner~id"
	ownerIdIndexKey, err := stub.CreateCompositeKey(indexName, []string{poomKey.PoomOwner, poomKey.PoomId})
	if err != nil {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key and a value")
	}
	// value 에 비어있는 바이트 배열 생성
	value := []byte{0x00}
	
	stub.PutState(ownerIdIndexKey, value)

	return string(poomKeyAsBytes), nil
}

func getKey(stub shim.ChaincodeStubInterface, arg string) (string, error) {
	res, err := stub.GetState(arg)
	if err != nil {
		return "", fmt.Errorf("Failed to get %s with error: %s", arg, err)
	}

	return string(res), nil
}

func getAllKeys(stub shim.ChaincodeStubInterface) (string, error) {

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
		fmt.Printf(res.Key, res.Value)
		comma = true
	}
	buffer += "]"

	fmt.Println(buffer)

	return string(buffer), nil
}

func getKeysByOwner(stub shim.ChaincodeStubInterface, args []string) (string, error) {
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
	var i int
	for i = 0; queriedKeysByOwnerIterator.HasNext(); i++ {
		res, err := queriedKeysByOwnerIterator.Next()
		if err != nil {
			return "", fmt.Errorf("%s", err)
		}
		objectType, compositeKeyParts, err := stub.SplitCompositeKey(res.Key)
		if err != nil {
			return "", fmt.Errorf("%s", err)
		}
		fmt.Printf("")
		returnedOwner := compositeKeyParts[0]
		returnedKey := compositeKeyParts[1]
		fmt.Printf("- found a key from index:%s owner:%s key:%s\n", objectType, returnedOwner, returnedKey)

		if comma == true {
			buffer += ","
		}
		
		getKeyResult, err := getKey(stub, returnedKey)
		buffer += getKeyResult
		comma = true
	}
	buffer += "]"

	fmt.Println("버퍼 내용 : ", buffer)
	
	return string(buffer), nil
}

// transfer 하면 index도 알아서 변경될까? ㄴㄴ World State에 저장하는 Composite Key는 자동으로 변경 안됨.
// 1. 따로 변경해주거나 2. Metadata 설정해주거나 3. 직접 get 해와야 함(Marbles 예제)
func changeKeyOwner(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if (len(args) != 3) {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key")
	}
	poomId := args[0]
	owner := args[1]
	newOwner := args[2]

	keyAsBytes, err := stub.GetState(poomId)
	if err != nil {
		return "", fmt.Errorf("%s", err)
	} else if keyAsBytes == nil {
		return "", fmt.Errorf("Key does not exist")
	}

	indexName := "owner~id"

	blank := "\u0000"

	indexKey := blank + indexName + blank + owner + blank + poomId + blank
	fmt.Println("앞 뒤가 똑같은 전화번호 " + indexKey + " 앞 뒤가 똑같은 전화번호")
	err = stub.DelState(indexKey)
	if err != nil {
		return "", fmt.Errorf("%s", err)
	}

	keyToTransfer := Key{}
	err = json.Unmarshal(keyAsBytes, &keyToTransfer)
	if err != nil {
		return "", fmt.Errorf("%s", err)
	}

	if keyToTransfer.PoomOwner != owner {
		return "", fmt.Errorf("Cannot match owner.")
	}
	
	keyToTransfer.PoomOwner = newOwner
	keyJSONasBytes, _ := json.Marshal(keyToTransfer)
	err = stub.PutState(poomId, keyJSONasBytes)
	if err != nil {
		return "", fmt.Errorf("%s", err)
	}

	ownerIdIndexKey, err := stub.CreateCompositeKey(indexName, []string{newOwner, poomId})
	if err != nil {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key and a value")
	}
	// value 에 비어있는 바이트 배열 생성
	value := []byte{0x00}

	stub.PutState(ownerIdIndexKey, value)

	return string(keyJSONasBytes), nil
}

func getHistoryByKey(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) != 1 {
		return "", fmt.Errorf("Incorrect number of arguments. Expecting 1")
	}

	poomId := args[0]

	fmt.Printf("- start getHistoryByKey: %s\n", poomId)

	resultsIterator, err := stub.GetHistoryForKey(poomId)
	if err != nil {
		return "", fmt.Errorf("%s", err)
	}
	defer resultsIterator.Close()

	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return "", fmt.Errorf("%s", err)
		}
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"TxId\":")
		buffer.WriteString("\"")
		buffer.WriteString(response.TxId)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Value\":")

		if response.IsDelete {
			buffer.WriteString("null")
		} else {
			buffer.WriteString(string(response.Value))
		}

		buffer.WriteString(", \"Timestamp\":")
		buffer.WriteString("\"")
		buffer.WriteString(time.Unix(response.Timestamp.Seconds, int64(response.Timestamp.Nanos)).String())
		buffer.WriteString("\"")

		buffer.WriteString(", \"IsDelete\":")
		buffer.WriteString("\"")
		buffer.WriteString(strconv.FormatBool(response.IsDelete))
		buffer.WriteString("\"")

		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- getHistoryByKey returning:\n%s\n", buffer.String())

	return buffer.String(), nil
}

func main() {
	if err := shim.Start(new(SimpleAsset)); err != nil {
		fmt.Printf("Error starting SimpleAsset chaincode: %s", err)
	}
}