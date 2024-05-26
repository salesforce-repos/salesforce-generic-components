public class QueryEditorController {
    @AuraEnabled (cacheable=true)//Method to get the List of All Objects
    public static Map<String, String> getAllObject(String profileName){
        set<String> uniqueObjects = new Set<String>();
        Integer totalObjectCount = 0;
        Integer currentObjectCount = 0;
        
        system.debug('ProfileName'+profileName);
        for(Query_Builder_Detail__c queryDetails :[SELECT Id,Object_Name__c FROM Query_Builder_Detail__c WHERE Active__c = TRUE AND Profile_Name__c = :profileName]){
            uniqueObjects.add(queryDetails.Object_Name__c);
        }
        
        
        if(uniqueObjects.size() > 0 ) {
            totalObjectCount = uniqueObjects.size();
            Map<String,String> returnObjectMap = new Map<String,String>();
            
            //Schema.getGlobalDescribe() => return a Map of type Map<String, Schema.SObjectType>
            Map<String, Schema.SObjectType> objectMap = Schema.getGlobalDescribe();
            
            //get List of all sObject
            List<Schema.SObjectType> objectMapValues = objectMap.Values();
            System.debug('All Objects '+ objectMap);
            
            //prepare a Map to send Data from Server to Client Side
            
            for(Schema.SObjectType objType : objectMapValues){
                String name = objType.getDescribe().getName();
                if (uniqueObjects.contains(name)) {
                    String key = name;
                    String value = objType.getDescribe().getLabel();
                    returnObjectMap.put(key,value);
                    currentObjectCount++;
                }
                if(currentObjectCount == totalObjectCount) {
                    break;
                }
                
            }
            System.debug(returnObjectMap);
            return returnObjectMap;
        }
        
        else{
            return null;
        }
    }
    
    @AuraEnabled (cacheable=true) //Method to get all the fields of a particular Object
    public static List<Query_Builder_Detail__c> getAllfields(String sObjectName,String profileName){
        List<String> profileNameList = profileName.split(',');
        return [SELECT Id, 
                	Field_API_Name__c, 
                	Object_Name__c, 
                	Filter_Field__c, 
                	Filter_Value__c, 
                	Operator__c, 
                	Selected_Field__c, 
                	Value_Criteria__c
                FROM Query_Builder_Detail__c
               	WHERE Object_Name__c = :sObjectName AND
                	  Profile_Name__c IN :profileNameList AND
                	  Active__c = TRUE
               ];
    	}
    
    @AuraEnabled
    public static List<FieldInfoWrapper> getObjectFields(String sObjectName) {
        List<FieldInfoWrapper> fieldInfoList = new List<FieldInfoWrapper>();
        
        // Get the object describe result
        Schema.DescribeSObjectResult objectDescribe = Schema.getGlobalDescribe().get(sObjectName).getDescribe();
        Map<String, Schema.SObjectField> fieldsMap = objectDescribe.fields.getMap();
        
        for (String fieldName : fieldsMap.keySet()) {
            Schema.DescribeFieldResult fieldDescribe = fieldsMap.get(fieldName).getDescribe();
            FieldInfoWrapper fieldInfo = new FieldInfoWrapper();
            fieldInfo.name = fieldDescribe.getName();
            fieldInfo.label = fieldDescribe.getLabel();
            fieldInfo.dataType = String.valueOf(fieldDescribe.getType());
            
            // For picklist fields, fetch picklist values with both labels and API names
            if (fieldDescribe.getType() == Schema.DisplayType.Picklist) {
                List<Schema.PicklistEntry> picklistValues = fieldDescribe.getPicklistValues();
                List<PicklistOption> picklistOptions = new List<PicklistOption>();
                for (Schema.PicklistEntry entry : picklistValues) {
                    PicklistOption option = new PicklistOption();
                    option.label = entry.getLabel();
                    option.value = entry.getValue();
                    picklistOptions.add(option);
                }
                fieldInfo.picklistOptions = picklistOptions;
            }
            // Add more necessary information to the wrapper class as needed
            
            fieldInfoList.add(fieldInfo);
        }
        
        return fieldInfoList;
    }
    
    @AuraEnabled
    public static List<Sobject> fetchData(String soqlQuery){
        List<Sobject> sobjectData = new List<Sobject>(); 
        System.debug('Test: '+ soqlQuery);
        try {
            sobjectData = Database.query(soqlQuery);
            
            
        }
        catch(Exception ex) {
            throw new AuraHandledException('Unable to fetch data'+ex);
        }
        
        return sobjectData;
        
    }
    
    @AuraEnabled(cacheable = true)
    public static List<PicklistOption> getOptionsForSelectedPicklistField(string selectedObjectName, string selectedField){
        List<PicklistOption> picklistOptions = new List<PicklistOption>();
        try {
            System.debug('selectedObjectName '+selectedObjectName);
            System.debug('selectedField '+selectedField);
            Map<String,String> options = new  Map<String,String>();
            
            Map<String, Schema.SObjectField> mapFields = Schema.getGlobalDescribe().get(selectedObjectName).getDescribe().fields.getMap();
            Schema.DescribeFieldResult pickFieldResult = mapFields.get(selectedField).getDescribe();   
            List<Schema.PicklistEntry> picklistFields1 = pickFieldResult.getPicklistValues();
            for( Schema.PicklistEntry pickListFields2 : picklistFields1)
            {
                PicklistOption option = new PicklistOption();
                option.label = pickListFields2.getLabel();
                option.value = pickListFields2.getValue();
                picklistOptions.add(option);
            }       
            return picklistOptions;
        } catch (Exception e) {
            throw new AuraHandledException('Unable to fetch data');
        }
    }
    
     @AuraEnabled(cacheable = true)
    public static Map<String,List<PicklistOption>> getPicklistValuesFromApex(string selectedObjectName, List<string> picklistFields){
        
        try {
            Map<String,List<PicklistOption>> picklistMap = new Map<String,List<PicklistOption>>();
            System.debug('selectedObjectName '+selectedObjectName);
            //System.debug('selectedField '+selectedField);
            Map<String,String> options = new  Map<String,String>();
            
            for(String field : picklistFields ) {
                Map<String, Schema.SObjectField> mapFields = Schema.getGlobalDescribe().get(selectedObjectName).getDescribe().fields.getMap();
                List<PicklistOption> picklistOptions = new List<PicklistOption>();
                Schema.DescribeFieldResult pickFieldResult = mapFields.get(field).getDescribe();   
                List<Schema.PicklistEntry> picklistFields1 = pickFieldResult.getPicklistValues();
                for( Schema.PicklistEntry pickListFields2 : picklistFields1)
                {
                    PicklistOption option = new PicklistOption();
                    option.label = pickListFields2.getLabel();
                    option.value = pickListFields2.getValue();
                    picklistOptions.add(option);
                }
                picklistMap.put(field,picklistOptions);
            }
            
            
            return picklistMap;
        } catch (Exception e) {
            throw new AuraHandledException('Unable to fetch data');
        }
    }
    
    
    public class FieldInfoWrapper {
        @AuraEnabled public String name;
        @AuraEnabled public String label;
        @AuraEnabled public String dataType;
        @AuraEnabled public List<PicklistOption> picklistOptions;        
        // Add more properties as needed
    }
    
    public class PicklistOption {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
    }
    
}